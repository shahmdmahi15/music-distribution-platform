export type ContractLevel =
  | 'ACCOUNT'
  | 'LABEL'
  | 'ARTIST'
  | 'RELEASE'
  | 'TRACK';

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'TERMINATED';

export type PayeeRole =
  | 'ARTIST'
  | 'LABEL'
  | 'PRODUCER'
  | 'COMPOSER'
  | 'PUBLISHER'
  | 'DISTRIBUTOR';

export type PayeeStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED';

export interface Payee {
  id: string;
  code: string;
  name: string;
  email: string;
  legalName?: string | null;
  taxId?: string | null;
  role: PayeeRole;
  status: PayeeStatus;
  paymentMethod: string;
  paymentDetails?: Record<string, any> | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ContractPayee {
  id: string;
  contractId: string;
  payeeId: string;
  sharePercentage: number;
  role: PayeeRole;
  payee?: Payee;
}

export interface ContractAsset {
  id: string;
  contractId: string;
  releaseId?: string | null;
  trackId?: string | null;
  artistName?: string | null;
  labelName?: string | null;
}

export interface Contract {
  id: string;
  code: string;
  title: string;
  level: ContractLevel;
  status: ContractStatus;
  startDate: string;
  expirationDate?: string | null;
  isActive: boolean;
  allFutureAssets: boolean;
  payMechanicals: boolean;
  advanceAmount?: number | null;
  recoupedAmount?: number | null;
  isRecouped: boolean;
  contractPayees: ContractPayee[];
  contractAssets?: ContractAsset[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateContractInput {
  name: string;
  level?: ContractLevel;
  status?: ContractStatus;
  targetId?: string;
  splits: Array<{
    payeeId: string;
    percentage: number;
    role?: PayeeRole;
  }>;
  allFutureAssets?: boolean;
  payMechanicals?: boolean;
  advanceAmount?: number;
}

export interface CreatePayeeInput {
  name: string;
  email: string;
  legalName?: string;
  taxId?: string;
  role?: PayeeRole;
  status?: PayeeStatus;
  paymentMethod?: string;
}
