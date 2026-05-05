export const getStatusLabel = (status: string) => {
  switch (status) {
    case "OPEN":
      return "Ouvert";
    case "IN_REVIEW":
      return "En cours";
    case "RESOLVED":
      return "Résolu";
    case "REJECTED":
      return "Rejeté";
    default:
      return status;
  }
};