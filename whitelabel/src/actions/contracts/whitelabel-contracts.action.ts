"use server";

import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { WL_SESSION_COOKIE } from "@/lib/auth-cookies";
import {
  Contract,
  Payee,
  CreateContractInput,
  CreatePayeeInput,
  ContractLevel,
} from "@/types/contracts";
import axios from "axios";
import { revalidatePath } from "next/cache";

async function getAuthHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WL_SESSION_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function wlGetContractsAction(params?: {
  level?: ContractLevel;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  message: string;
  data: Contract[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.get("/whitelabel/contracts", {
      headers,
      params,
    });
    return {
      success: true,
      message: "Contracts retrieved successfully.",
      data: res.data.data || res.data || [],
      meta: res.data.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
      };
    }
    return {
      success: false,
      message: (error as Error).message,
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  }
}

export async function wlCreateContractAction(input: CreateContractInput): Promise<{
  success: boolean;
  message: string;
  contract?: Contract;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.post("/whitelabel/contracts", input, {
      headers,
    });
    revalidatePath("/contracts");
    return {
      success: true,
      message: "Split contract created successfully.",
      contract: res.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}

export async function wlGetPayeesAction(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  message: string;
  data: Payee[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.get("/whitelabel/contracts/payees", {
      headers,
      params,
    });
    return {
      success: true,
      message: "Payees retrieved successfully.",
      data: res.data.data || res.data || [],
      meta: res.data.meta || { total: 0, page: 1, limit: 50, totalPages: 1 },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: [],
        meta: { total: 0, page: 1, limit: 50, totalPages: 1 },
      };
    }
    return {
      success: false,
      message: (error as Error).message,
      data: [],
      meta: { total: 0, page: 1, limit: 50, totalPages: 1 },
    };
  }
}

export async function wlCreatePayeeAction(input: CreatePayeeInput): Promise<{
  success: boolean;
  message: string;
  payee?: Payee;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.post("/whitelabel/contracts/payees", input, {
      headers,
    });
    revalidatePath("/contracts");
    return {
      success: true,
      message: "Payee profile registered successfully.",
      payee: res.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}

export async function wlGetEffectiveSplitAction(params: {
  trackId?: string;
  releaseId?: string;
  artistId?: string;
}): Promise<{
  success: boolean;
  message: string;
  split?: any;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.get("/whitelabel/contracts/effective-split", {
      headers,
      params,
    });
    return {
      success: true,
      message: "Effective split hierarchy resolved.",
      split: res.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}
