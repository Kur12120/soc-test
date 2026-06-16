import * as ldap from "ldapjs";

export interface LdapConfig {
  url: string;
  bindDN: string;
  bindPassword: string;
  searchBase: string;
  searchFilter: string;
  tlsEnabled: boolean;
}

export async function authenticateWithLdap(
  config: LdapConfig,
  username: string,
  password: string
): Promise<{ success: boolean; displayName?: string; email?: string; error?: string }> {
  return new Promise((resolve) => {
    const client = ldap.createClient({
      url: config.url,
      tlsOptions: config.tlsEnabled ? { rejectUnauthorized: false } : undefined,
      timeout: 5000,
      connectTimeout: 5000,
    });

    client.on("error", (err) => {
      resolve({ success: false, error: err.message });
    });

    client.bind(config.bindDN, config.bindPassword, (err) => {
      if (err) {
        client.destroy();
        resolve({ success: false, error: "LDAP bind failed: " + err.message });
        return;
      }

      const filter = config.searchFilter.replace("{username}", username);

      client.search(config.searchBase, {
        filter,
        scope: "sub",
        attributes: ["dn", "cn", "mail", "displayName", "userPrincipalName"],
      }, (err, res) => {
        if (err) {
          client.destroy();
          resolve({ success: false, error: "LDAP search failed" });
          return;
        }

        let userDn: string | null = null;
        let displayName: string | undefined;
        let email: string | undefined;

        res.on("searchEntry", (entry) => {
          userDn = entry.dn.toString();
          const attrs = entry.attributes.attributes;
          displayName = attrs.find((a: any) => a.type === "displayName")?.values[0]
            || attrs.find((a: any) => a.type === "cn")?.values[0];
          email = attrs.find((a: any) => a.type === "mail")?.values[0]
            || attrs.find((a: any) => a.type === "userPrincipalName")?.values[0];
        });

        res.on("end", () => {
          if (!userDn) {
            client.destroy();
            resolve({ success: false, error: "User not found in LDAP" });
            return;
          }

          client.bind(userDn, password, (err) => {
            client.destroy();
            if (err) {
              resolve({ success: false, error: "Invalid LDAP credentials" });
            } else {
              resolve({ success: true, displayName, email });
            }
          });
        });

        res.on("error", () => {
          client.destroy();
          resolve({ success: false, error: "LDAP search error" });
        });
      });
    });
  });
}
