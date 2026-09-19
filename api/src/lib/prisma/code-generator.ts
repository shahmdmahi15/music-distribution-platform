import { PrismaService } from './prisma.service';

export enum CodePrefix {
  PLATFORM_USER = 'RMIT-PLU-',
  WHITELABEL_USER = 'RMIT-WLU-',
  WHITELABEL = 'RMIT-WL-',
  PLATFORM_SUBSCRIPTION = 'RMIT-SUB-',
  PLATFORM_PAYMENT = 'RMIT-PAY-',
  SESSION = 'RMIT-SES-',
  OAUTH_ACCOUNT = 'RMIT-OAU-',
  WHITELABEL_PARTNER = 'RMIT-PRT-',
  WHITELABEL_ARTIST = 'RMIT-ART-',
  WHITELABEL_DOCUMENT = 'RMIT-DOC-',
}

export type CodeModel =
  | 'platformUser'
  | 'whiteLabelUser'
  | 'whiteLabel'
  | 'platformSubscription'
  | 'platformSubscriptionPayment'
  | 'session'
  | 'oAuthAccount'
  | 'whiteLabelPartner'
  | 'whiteLabelTopArtist'
  | 'whiteLabelDocument';

/**
 * Sequence backing each model's human-readable code.
 *
 * The sequences are created by migration, not at runtime, so this helper needs
 * no DDL privileges and takes no locks on the hot path.
 */
const CODE_SEQUENCES: Record<CodeModel, string> = {
  platformUser: 'platformuser_code_seq',
  whiteLabelUser: 'whitelabeluser_code_seq',
  whiteLabel: 'whitelabel_code_seq',
  platformSubscription: 'platformsubscription_code_seq',
  platformSubscriptionPayment: 'platformsubscriptionpayment_code_seq',
  session: 'session_code_seq',
  oAuthAccount: 'oauthaccount_code_seq',
  whiteLabelPartner: 'whitelabelpartner_code_seq',
  whiteLabelTopArtist: 'whitelabeltopartist_code_seq',
  whiteLabelDocument: 'whitelabeldocument_code_seq',
};

export async function generateUniqueCode(
  prisma: PrismaService,
  modelName: CodeModel,
  prefix: CodePrefix,
): Promise<string> {
  const result = await prisma.$queryRaw<{ nextval: bigint }[]>`
    SELECT nextval(${CODE_SEQUENCES[modelName]}::regclass) AS nextval
  `;

  const next = result[0]?.nextval;
  if (next === undefined) {
    throw new Error(`Sequence for ${modelName} returned no value`);
  }

  return `${prefix}${String(next).padStart(7, '0')}`;
}
