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

export async function generateUniqueCode(
  prisma: PrismaService,
  modelName:
    | 'platformUser'
    | 'whiteLabelUser'
    | 'whiteLabel'
    | 'platformSubscription'
    | 'platformSubscriptionPayment'
    | 'session'
    | 'oAuthAccount'
    | 'whiteLabelPartner'
    | 'whiteLabelTopArtist'
    | 'whiteLabelDocument',
  prefix: CodePrefix,
): Promise<string> {
  const sequenceName = `${modelName.toLowerCase()}_code_seq`;
  try {
    await prisma.$executeRawUnsafe(
      `CREATE SEQUENCE IF NOT EXISTS ${sequenceName} START 1;`,
    );
    const result = await prisma.$queryRawUnsafe<
      { nextval: string | number | bigint }[]
    >(`SELECT nextval('${sequenceName}') as nextval;`);
    const num = Number(result[0]?.nextval || 1);
    return `${prefix}${String(num).padStart(7, '0')}`;
  } catch {
    // Fallback if raw query fails
    const count = await (prisma[modelName] as any).count();
    const randomOffset = Math.floor(Math.random() * 900) + 100;
    const num = count + randomOffset;
    return `${prefix}${String(num).padStart(7, '0')}`;
  }
}
