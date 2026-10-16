import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CodePrefix, generateUniqueCode } from 'src/lib/prisma/code-generator';
import {
  DeliveryStatus,
  DdexVersion,
  DspStore,
} from 'src/generated/prisma/client';

@Injectable()
export class DdexGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Converts seconds into standard ISO-8601 duration string (e.g. 225s -> PT3M45S).
   */
  private formatIsoDuration(totalSeconds: number): string {
    if (!totalSeconds || totalSeconds <= 0) return 'PT0S';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    let res = 'PT';
    if (hours > 0) res += `${hours}H`;
    if (minutes > 0 || hours > 0) res += `${minutes}M`;
    res += `${seconds}S`;
    return res;
  }

  private escapeXml(unsafe: string | null | undefined): string {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generates standard-compliant DDEX ERN 4.3 XML message for digital distribution delivery.
   */
  async generateReleaseErnXml(releaseId: string): Promise<string> {
    const release = await this.prisma.release.findFirst({
      where: {
        OR: [{ id: releaseId }, { code: releaseId }],
      },
      include: {
        whiteLabel: true,
        contributors: true,
        tracks: {
          orderBy: [{ discNumber: 'asc' }, { trackNumber: 'asc' }],
          include: {
            contributors: true,
          },
        },
      },
    });

    if (!release) {
      throw new NotFoundException(`Release ${releaseId} not found`);
    }

    if (!release.tracks.length) {
      throw new BadRequestException(
        'Release must contain at least one track to generate DDEX manifest.',
      );
    }

    const messageId = `RMIT_ERN_${release.code}_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const releaseYear = release.releaseDate
      ? release.releaseDate.getFullYear()
      : new Date().getFullYear();
    const releaseDateStr = release.releaseDate
      ? release.releaseDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const senderPartyName = this.escapeXml(
      release.whiteLabel?.name || 'Royal Motion IT Distribution',
    );
    const labelName = this.escapeXml(
      release.labelName ||
        release.whiteLabel?.name ||
        'Royal Motion IT Records',
    );

    // 1. Build SoundRecording Elements
    const soundRecordingXml = release.tracks
      .map((track, idx) => {
        const trackRef = `A${idx + 1}`;
        const duration = this.formatIsoDuration(track.durationSeconds || 180);
        const isrc = track.isrc
          ? `<ISRC>${this.escapeXml(track.isrc)}</ISRC>`
          : '';
        const title = this.escapeXml(track.title);

        const trackContributors = track.contributors?.length
          ? track.contributors
          : release.contributors;

        const contributorsXml = trackContributors
          .map(
            (c) => `
        <ResourceContributor>
          <PartyName>
            <FullName>${this.escapeXml(c.name)}</FullName>
          </PartyName>
          <Role>${this.escapeXml(c.role || 'PrimaryArtist')}</Role>
        </ResourceContributor>`,
          )
          .join('');

        return `
    <SoundRecording>
      <ResourceReference>${trackRef}</ResourceReference>
      <Type>MusicalWorkSoundRecording</Type>
      <SoundRecordingId>
        ${isrc}
        <ProprietaryId Namespace="RoyalMotionIT">${this.escapeXml(track.code)}</ProprietaryId>
      </SoundRecordingId>
      <DisplayTitleText>${title}</DisplayTitleText>
      <Duration>${duration}</Duration>
      ${contributorsXml}
      <TechnicalDetails>
        <TechnicalResourceDetailsReference>T${trackRef}</TechnicalResourceDetailsReference>
        <AudioCodecType>FLAC</AudioCodecType>
        <BitRate UnitOfMeasure="kbps">1411</BitRate>
        <SamplingRate UnitOfMeasure="kHz">44.1</SamplingRate>
        <BitsPerSample>16</BitsPerSample>
        <NumberOfChannels>2</NumberOfChannels>
        <File>
          <URI>${this.escapeXml(track.audioKey || `${track.code}.flac`)}</URI>
        </File>
      </TechnicalDetails>
    </SoundRecording>`;
      })
      .join('\n');

    // 2. Build Image Artwork Element
    const coverArtXml = release.coverArtKey
      ? `
    <Image>
      <ResourceReference>IMG1</ResourceReference>
      <Type>FrontCoverImage</Type>
      <TechnicalDetails>
        <TechnicalResourceDetailsReference>TIMG1</TechnicalResourceDetailsReference>
        <ImageCodecType>JPEG</ImageCodecType>
        <File>
          <URI>${this.escapeXml(release.coverArtKey)}</URI>
        </File>
      </TechnicalDetails>
    </Image>`
      : '';

    // 3. Build Release ResourceGroup linking Tracks & Artwork
    const resourceGroupContent = release.tracks
      .map((track, idx) => {
        return `
        <ResourceGroupContentItem>
          <SequenceNumber>${track.trackNumber || idx + 1}</SequenceNumber>
          <ResourceType>SoundRecording</ResourceType>
          <ReleaseResourceReference>A${idx + 1}</ReleaseResourceReference>
        </ResourceGroupContentItem>`;
      })
      .join('');

    const imageGroupItem = release.coverArtKey
      ? `
        <ResourceGroupContentItem>
          <SequenceNumber>1</SequenceNumber>
          <ResourceType>Image</ResourceType>
          <ReleaseResourceReference>IMG1</ReleaseResourceReference>
        </ResourceGroupContentItem>`
      : '';

    // 4. Build Complete ERN 4.3 XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ern:NewReleaseMessage xmlns:ern="http://ddex.net/xml/ern/43" xmlns:xs="http://www.w3.org/2001/XMLSchema-instance" MessageSchemaVersionId="ern/43" ReleaseProfileVersionId="CommonReleaseTypes/14/AudioAlbumMusicOnly">
  <MessageHeader>
    <MessageId>${messageId}</MessageId>
    <MessageSender>
      <PartyName>
        <FullName>${senderPartyName}</FullName>
      </PartyName>
    </MessageSender>
    <MessageRecipient>
      <PartyName>
        <FullName>GenericDSP</FullName>
      </PartyName>
    </MessageRecipient>
    <MessageCreatedDateTime>${timestamp}</MessageCreatedDateTime>
    <MessageControlType>LiveMessage</MessageControlType>
  </MessageHeader>

  <ResourceList>
${soundRecordingXml}
${coverArtXml}
  </ResourceList>

  <ReleaseList>
    <Release>
      <ReleaseReference>R0</ReleaseReference>
      <ReleaseType>${this.escapeXml(release.type || 'Single')}</ReleaseType>
      <ReleaseId>
        ${release.upc ? `<ICPN>${this.escapeXml(release.upc)}</ICPN>` : ''}
        ${release.catalogNumber ? `<CatalogNumber Namespace="${labelName}">${this.escapeXml(release.catalogNumber)}</CatalogNumber>` : ''}
        <ProprietaryId Namespace="RoyalMotionIT">${this.escapeXml(release.code)}</ProprietaryId>
      </ReleaseId>
      <DisplayTitleText>${this.escapeXml(release.title)}</DisplayTitleText>
      <DisplayArtist>
        <PartyName>
          <FullName>${this.escapeXml(release.contributors[0]?.name || senderPartyName)}</FullName>
        </PartyName>
        <ArtistRole>PrimaryArtist</ArtistRole>
      </DisplayArtist>
      <Genre>
        <GenreText>${this.escapeXml(release.genre || 'Pop')}</GenreText>
        ${release.subgenre ? `<SubGenre>${this.escapeXml(release.subgenre)}</SubGenre>` : ''}
      </Genre>
      <PLine>
        <Year>${releaseYear}</Year>
        <PLineText>${this.escapeXml(release.pLine || `℗ ${releaseYear} ${labelName}`)}</PLineText>
      </PLine>
      <CLine>
        <Year>${releaseYear}</Year>
        <CLineText>${this.escapeXml(release.cLine || `© ${releaseYear} ${labelName}`)}</CLineText>
      </CLine>
      <ReleaseDate>${releaseDateStr}</ReleaseDate>
      <ResourceGroup>
        <ResourceGroup>
          <SequenceNumber>1</SequenceNumber>
          ${resourceGroupContent}
          ${imageGroupItem}
        </ResourceGroup>
      </ResourceGroup>
    </Release>
  </ReleaseList>

  <DealList>
    <ReleaseDeal>
      <DealReleaseReference>R0</DealReleaseReference>
      <Deal>
        <DealTerms>
          <CommercialModelType>SubscriptionModel</CommercialModelType>
          <Usage>
            <UseType>OnDemandStream</UseType>
          </Usage>
          <Usage>
            <UseType>PermanentDownload</UseType>
          </Usage>
          <TerritoryCode>Worldwide</TerritoryCode>
          <ValidityPeriod>
            <StartDate>${releaseDateStr}</StartDate>
          </ValidityPeriod>
        </DealTerms>
      </Deal>
    </ReleaseDeal>
  </DealList>
</ern:NewReleaseMessage>`;

    // 5. Store / update delivery package record
    const deliveryCode = await generateUniqueCode(
      this.prisma,
      'dspDeliveryPackage',
      CodePrefix.DSP_DELIVERY_PACKAGE,
    );

    await this.prisma.dspDeliveryPackage.create({
      data: {
        code: deliveryCode,
        releaseId: release.id,
        whiteLabelId: release.whiteLabelId,
        targetDsp: DspStore.SPOTIFY,
        ddexVersion: DdexVersion.ERN_43,
        status: DeliveryStatus.PACKAGED,
      },
    });

    return xml;
  }
}
