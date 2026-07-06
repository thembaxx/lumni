import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { getBillingInfo } from "@/lib/school/billing-service";
import { getSchool, getSchoolMembers } from "@/lib/school/service";

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "AdminSchoolDetail",
  execute: async ({ params }) => {
    const schoolId = params?.schoolId;
    if (!schoolId) throw new HttpError(400, "schoolId is required");

    const school = await getSchool(schoolId);
    if (!school) throw new HttpError(404, "School not found");

    const members = await getSchoolMembers(schoolId);
    const billing = await getBillingInfo(schoolId, 1, 5);

    return {
      school,
      admins: members.admins,
      teachers: members.teachers,
      studentCount: members.students.length,
      recentInvoices: billing.invoices,
      usageStats: {
        totalQuizzes: 0,
        totalQuestions: 0,
        avgScore: 0,
        activeTeachersLast30d: members.teachers.length,
        activeStudentsLast30d: members.students.length,
      },
    };
  },
});
