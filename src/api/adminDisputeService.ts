import { API } from "./api";

export const getAllDisputesAdmin = async () => {
  const res = await API.get("/admin/disputes");
  return res.data;
};

export const resolveDisputeAdmin = async (
  id: number,
  decision: "RESOLVED" | "REJECTED"| "IN_REVIEW",
  adminDecision?: string
) => {
  return API.put(`/admin/disputes/${id}/resolve`, {
    decision,
    adminDecision,
    action:null
  });
};