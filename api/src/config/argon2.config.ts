import * as argon2 from 'argon2';

/**
 * OWASP Recommended Argon2id Profiles (Adjusted for typical Cloud/VPC environments)
 */
export const ARGON2_CONFIG: argon2.Options & { type: typeof argon2.argon2id } =
  {
    // Explicitly enforce the argon2id variant
    type: argon2.argon2id,

    // 64 MB of RAM (Prevents massive parallel GPU guessing attacks)
    memoryCost: 65536,

    // 3 sequential passes through memory
    timeCost: 3,

    // 4 computational lanes/threads
    // NOTE: Match this to the CPU cores on your host machine
    parallelism: 4,
  };
