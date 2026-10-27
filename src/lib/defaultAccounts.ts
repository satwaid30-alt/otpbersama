import { AuthenticatorAccount } from "./types";

export const DEFAULT_ACCOUNTS: AuthenticatorAccount[] = [
  {
    id: "dapodik-stafgeteka-primary",
    issuer: "Dapodik (GTK Jabar)",
    account: "stafgetekajabar@gmail.com",
    secret: "MY2DMNBRHAZWKLJWGFSDSLJUGFQWILJYMI2TELJQGQ3DMOLCMUZTQOJZMI",
    digits: 6,
    period: 30,
    color: "#0288D1", // Kemdikbud Blue
    icon: "school",
    pinned: true,
    createdAt: 1730000000000,
  },
];
