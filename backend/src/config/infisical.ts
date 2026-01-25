import "dotenv/config";
import { InfisicalSDK } from "@infisical/sdk";

// Initialize the SDK
const client = new InfisicalSDK({
    siteUrl: "https://app.infisical.com" // Change if self-hosted
});

export const initInfisical = async () => {
    // 1. Authenticate with Machine Identity
    await client.auth().universalAuth.login({
        clientId: process.env.INFISICAL_CLIENT_ID!,
        clientSecret: process.env.INFISICAL_CLIENT_SECRET!
    });

    return client;
};

export { client };