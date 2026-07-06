import { Query } from "appwrite";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/constants";
import { logError } from "@/lib/shared/logger";
import { generateSchoolCode, generateSlug } from "./pricing";

export interface SchoolCreateInput {
  name: string;
  domain?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
}

export interface SchoolResult {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  contactEmail: string;
  contactPhone: string | null;
  address: string | null;
  licenseTier: string;
  seatCount: number;
  seatsUsed: number;
  billingStatus: string;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolMemberResult {
  id: string;
  schoolId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  grade?: string;
}

function mapSchool(doc: Record<string, unknown>): SchoolResult {
  return {
    id: doc.$id as string,
    name: doc.name as string,
    slug: doc.slug as string,
    domain: (doc.domain as string) || null,
    contactEmail: doc.contactEmail as string,
    contactPhone: (doc.contactPhone as string) || null,
    address: (doc.address as string) || null,
    licenseTier: doc.licenseTier as string,
    seatCount: (doc.seatCount as number) || 0,
    seatsUsed: (doc.seatsUsed as number) || 0,
    billingStatus: doc.billingStatus as string,
    trialEndsAt: (doc.trialEndsAt as string) || null,
    createdAt: doc.createdAt as string,
    updatedAt: doc.updatedAt as string,
  };
}

export async function createSchool(
  input: SchoolCreateInput,
  userId: string,
): Promise<{ school: SchoolResult; joinCode: string }> {
  const schoolId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const slug = generateSlug(input.name);
  const joinCode = generateSchoolCode();
  const now = new Date().toISOString();

  try {
    if (input.domain) {
      const existing = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.SCHOOLS, [
        Query.equal("domain", input.domain),
      ]);
      if (existing.total > 0) {
        throw Object.assign(new Error("Domain already registered"), { code: "DOMAIN_TAKEN" });
      }
    }

    await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.SCHOOLS, schoolId, {
      name: input.name,
      slug,
      domain: input.domain || null,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone || null,
      address: input.address || null,
      licenseTier: "free",
      seatCount: 1,
      seatsUsed: 1,
      billingStatus: "active",
      trialEndsAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.SCHOOL_MEMBERS, "unique()", {
      schoolId,
      userId,
      role: "admin",
      status: "active",
      joinedAt: now,
      createdAt: now,
    });

    await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.SCHOOL_MEMBERS, "unique()", {
      schoolId,
      userId,
      role: "teacher",
      status: "active",
      joinedAt: now,
      createdAt: now,
    });

    await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.SCHOOL_CODES, "unique()", {
      code: joinCode,
      schoolId,
      type: "teacher",
      maxUses: null,
      useCount: 0,
      expiresAt: null,
      createdBy: userId,
      createdAt: now,
    });

    return {
      school: {
        id: schoolId,
        name: input.name,
        slug,
        domain: input.domain || null,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone || null,
        address: input.address || null,
        licenseTier: "free",
        seatCount: 1,
        seatsUsed: 1,
        billingStatus: "active",
        trialEndsAt: null,
        createdAt: now,
        updatedAt: now,
      },
      joinCode,
    };
  } catch (err) {
    logError("SchoolService.CreateSchool", err, { userId });
    throw err;
  }
}

export async function getSchool(schoolId: string): Promise<SchoolResult | null> {
  try {
    const doc = await databases.getDocument(APPWRITE_DATABASE_ID, COLLECTIONS.SCHOOLS, schoolId);
    return mapSchool(doc as unknown as Record<string, unknown>);
  } catch (err) {
    logError("SchoolService.GetSchool", err, { schoolId });
    return null;
  }
}

export async function listSchools(
  page = 1,
  limit = 20,
  status?: string,
  _search?: string,
): Promise<{ schools: SchoolResult[]; total: number }> {
  try {
    const queries = [
      Query.limit(limit),
      Query.offset((page - 1) * limit),
      Query.orderDesc("createdAt"),
    ];
    if (status) {
      queries.push(Query.equal("billingStatus", status));
    }

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.SCHOOLS,
      queries,
    );

    return {
      schools: response.documents.map((d) => mapSchool(d as unknown as Record<string, unknown>)),
      total: response.total,
    };
  } catch (err) {
    logError("SchoolService.ListSchools", err);
    return { schools: [], total: 0 };
  }
}

export async function getSchoolMembers(schoolId: string): Promise<{
  admins: SchoolMemberResult[];
  teachers: SchoolMemberResult[];
  students: SchoolMemberResult[];
}> {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.SCHOOL_MEMBERS,
      [Query.equal("schoolId", schoolId), Query.equal("status", "active")],
    );

    const members = response.documents.map(
      (d) =>
        ({
          id: d.$id,
          schoolId: d.schoolId as string,
          userId: d.userId as string,
          role: d.role as string,
          status: d.status as string,
          joinedAt: d.joinedAt as string,
          grade: d.grade as string,
        }) as SchoolMemberResult,
    );

    return {
      admins: members.filter(
        (m) => m.role === "admin" || m.role === "billing" || m.role === "teacher_manager",
      ),
      teachers: members.filter((m) => m.role === "teacher"),
      students: members.filter((m) => m.role === "student"),
    };
  } catch (err) {
    logError("SchoolService.GetSchoolMembers", err, { schoolId });
    return { admins: [], teachers: [], students: [] };
  }
}

export async function addSchoolMember(
  schoolId: string,
  userId: string,
  role: "teacher" | "student",
): Promise<SchoolMemberResult | null> {
  try {
    const now = new Date().toISOString();
    const doc = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.SCHOOL_MEMBERS,
      "unique()",
      {
        schoolId,
        userId,
        role,
        status: "active",
        joinedAt: now,
        createdAt: now,
      },
    );

    if (role === "teacher") {
      const school = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.SCHOOLS,
        schoolId,
      );
      const currentUsed = (school.seatsUsed as number) || 0;
      await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTIONS.SCHOOLS, schoolId, {
        seatsUsed: currentUsed + 1,
      });
    }

    return {
      id: doc.$id,
      schoolId: doc.schoolId as string,
      userId: doc.userId as string,
      role: doc.role as string,
      status: doc.status as string,
      joinedAt: doc.joinedAt as string,
    };
  } catch (err) {
    logError("SchoolService.AddSchoolMember", err, { schoolId, userId, role });
    return null;
  }
}

export async function isUserSchoolMember(
  schoolId: string,
  userId: string,
): Promise<{ isMember: boolean; role?: string }> {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.SCHOOL_MEMBERS,
      [
        Query.equal("schoolId", schoolId),
        Query.equal("userId", userId),
        Query.equal("status", "active"),
      ],
    );
    if (response.total === 0) return { isMember: false };
    const member = response.documents[0];
    return { isMember: true, role: member.role as string };
  } catch (err) {
    logError("SchoolService.IsUserSchoolMember", err, { schoolId, userId });
    return { isMember: false };
  }
}

export async function lookupSchoolByCode(
  code: string,
): Promise<{ school: SchoolResult | null; type: string | null }> {
  try {
    const codeDoc = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.SCHOOL_CODES, [
      Query.equal("code", code.toUpperCase()),
    ]);
    if (codeDoc.total === 0) return { school: null, type: null };

    const entry = codeDoc.documents[0];
    if (entry.expiresAt && new Date(entry.expiresAt as string) < new Date()) {
      return { school: null, type: null };
    }
    if (entry.maxUses && (entry.useCount as number) >= (entry.maxUses as number)) {
      return { school: null, type: null };
    }

    const school = await getSchool(entry.schoolId as string);
    return { school, type: entry.type as string };
  } catch (err) {
    logError("SchoolService.LookupSchoolByCode", err, { code });
    return { school: null, type: null };
  }
}

export async function checkDomain(
  domain: string,
): Promise<{ registered: boolean; schoolName?: string; schoolId?: string }> {
  try {
    const response = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.SCHOOLS, [
      Query.equal("domain", domain.toLowerCase().trim()),
    ]);
    if (response.total === 0) return { registered: false };
    const doc = response.documents[0];
    return {
      registered: true,
      schoolName: doc.name as string,
      schoolId: doc.$id,
    };
  } catch (err) {
    logError("SchoolService.CheckDomain", err, { domain });
    return { registered: false };
  }
}
