import * as React from "react";

type UserProfileSetupEmailProps = {
  recipientName: string;
  schoolName: string;
  setupUrl: string;
  expiresInDays: number;
  maxUses: number;
};

export function UserProfileSetupEmail({
  recipientName,
  schoolName,
  setupUrl,
  expiresInDays,
  maxUses,
}: UserProfileSetupEmailProps) {
  return (
    <html>
      <body style={{ fontFamily: "Arial, sans-serif", background: "#f6f7fb", padding: "24px", color: "#1f2937" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", background: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e5e7eb" }}>
          <h2 style={{ marginTop: 0 }}>Complete your Drivio profile</h2>
          <p>Hello {recipientName || "there"},</p>
          <p>
            You were added to <strong>{schoolName}</strong> in Drivio. Complete your profile to activate your account.
          </p>
          <p>
            This link is valid for <strong>{expiresInDays} days</strong> and up to <strong>{maxUses} attempts</strong>.
          </p>
          <p style={{ margin: "24px 0" }}>
            <a
              href={setupUrl}
              style={{
                display: "inline-block",
                background: "#4f46e5",
                color: "#ffffff",
                textDecoration: "none",
                padding: "12px 18px",
                borderRadius: "8px",
                fontWeight: 600,
              }}
            >
              Complete Profile
            </a>
          </p>
          <p style={{ fontSize: "13px", color: "#6b7280" }}>
            If the button does not work, copy and paste this URL in your browser:
            <br />
            {setupUrl}
          </p>
        </div>
      </body>
    </html>
  );
}
