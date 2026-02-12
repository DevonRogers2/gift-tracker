import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Recipient {
  id: string;
  user_id: string;
  name: string;
  birthday: string;
}

interface Profile {
  id: string;
  email: string;
  notifications_enabled: boolean;
}

interface GiftIdea {
  id: string;
  recipient_id: string;
  title: string;
  estimated_cost: number;
  purchased: boolean;
}

async function sendEmailNotification(
  toEmail: string,
  recipientName: string,
  daysUntil: number,
  giftIdeas: GiftIdea[]
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  const unpurchasedIdeas = giftIdeas.filter((g) => !g.purchased);
  const purchasedCount = giftIdeas.filter((g) => g.purchased).length;

  let notificationType = "";
  if (daysUntil === 14) {
    notificationType = "14 days away";
  } else if (daysUntil === 7) {
    notificationType = "one week away";
  } else if (daysUntil === 1) {
    notificationType = "tomorrow";
  }

  const giftIdeasHtml = unpurchasedIdeas
    .map(
      (idea) => `
    <li style="margin-bottom: 10px;">
      <strong>${idea.title}</strong>
      ${idea.estimated_cost ? `<br/>Estimated cost: $${idea.estimated_cost.toFixed(2)}` : ""}
    </li>
  `
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px; }
        .content { background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .gift-list { list-style: none; padding: 0; }
        .footer { color: #666; font-size: 12px; text-align: center; margin-top: 20px; }
        .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Birthday Reminder!</h1>
        </div>

        <div class="content">
          <p>Hi there,</p>
          <p><strong>${recipientName}'s</strong> birthday is <strong>${notificationType}</strong>!</p>

          ${unpurchasedIdeas.length > 0 ? `
            <h2>Gift Ideas:</h2>
            <ul class="gift-list">
              ${giftIdeasHtml}
            </ul>
            <p>You have ${purchasedCount} items already purchased.</p>
          ` : `
            <p>You have ${purchasedCount} gift ideas for ${recipientName}.</p>
          `}
        </div>

        <div style="text-align: center;">
          <a href="${supabaseUrl}/auth/verify" class="button">View in GiftTracker</a>
        </div>

        <div class="footer">
          <p>This is an automated message from GiftTracker. You can disable notifications in your account settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: toEmail,
        subject: `Birthday reminder: ${recipientName} is ${notificationType}!`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send email:", await response.text());
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

function getDaysUntilBirthday(birthdayStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const birthday = new Date(birthdayStr);
  let nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate());
  }

  const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase credentials" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: recipients, error: recipientsError } = await (
      await fetch(`${supabaseUrl}/rest/v1/recipients`, {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
        },
      })
    ).json();

    if (recipientsError) throw recipientsError;

    let notificationsSent = 0;

    for (const recipient of recipients || []) {
      const daysUntil = getDaysUntilBirthday(recipient.birthday);

      if (![1, 7, 14].includes(daysUntil)) {
        continue;
      }

      const { data: profile, error: profileError } = await (
        await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${recipient.user_id}`, {
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            apikey: supabaseServiceKey,
          },
        })
      ).json();

      if (profileError || !profile?.[0]) {
        console.error("Profile not found for user:", recipient.user_id);
        continue;
      }

      const userProfile = profile[0];

      if (!userProfile.notifications_enabled) {
        continue;
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: existingLog } = await (
        await fetch(
          `${supabaseUrl}/rest/v1/notification_log?user_id=eq.${recipient.user_id}&recipient_id=eq.${recipient.id}&notification_type=eq.${daysUntil}day&sent_date=eq.${today}`,
          {
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              apikey: supabaseServiceKey,
            },
          }
        )
      ).json();

      if (existingLog && existingLog.length > 0) {
        console.log("Notification already sent for this recipient and day");
        continue;
      }

      const { data: giftIdeas } = await (
        await fetch(`${supabaseUrl}/rest/v1/gift_ideas?recipient_id=eq.${recipient.id}`, {
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            apikey: supabaseServiceKey,
          },
        })
      ).json();

      await sendEmailNotification(userProfile.email, recipient.name, daysUntil, giftIdeas || []);

      const notificationType = daysUntil === 14 ? "14days" : daysUntil === 7 ? "7days" : "1day";

      await fetch(`${supabaseUrl}/rest/v1/notification_log`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: recipient.user_id,
          recipient_id: recipient.id,
          notification_type: notificationType,
          sent_date: today,
        }),
      });

      notificationsSent++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
