import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Mappe les champs du formulaire (name) vers les propriétés Notion.
// La clé = name du champ côté form, la valeur = { prop, type }.
const SELECT_FIELDS: Record<string, string> = {
  q1: "Q1 Notation commande",
  q2_calcul: "Q2 Calcul devis",
  q2_hesitation: "Q2 Hésitation client",
  q3_retrouver: "Q3 Retrouver historique",
  q3_temps: "Q3 Temps recherche",
  q5_prix: "Q5 Prix /mois",
};

type Payload = {
  atelier?: string;
  q1?: string;
  q1_logiciel?: string;
  q2_calcul?: string;
  q2_hesitation?: string;
  q3_retrouver?: string;
  q3_temps?: string;
  q4_galeres?: string[];
  q5_prix?: string;
  email?: string;
  optin?: boolean;
};

export async function POST(req: Request) {
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    return NextResponse.json(
      { error: "Config manquante (NOTION_TOKEN / NOTION_DATABASE_ID)." },
      { status: 500 }
    );
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  // Titre de la page = atelier/ville si fourni, sinon un libellé daté.
  const title =
    body.atelier?.trim() ||
    `Réponse anonyme — ${new Date().toLocaleDateString("fr-FR")}`;

  const properties: Record<string, unknown> = {
    "Atelier / Ville": { title: [{ text: { content: title.slice(0, 200) } }] },
  };

  for (const [field, prop] of Object.entries(SELECT_FIELDS)) {
    const value = (body as Record<string, unknown>)[field];
    if (typeof value === "string" && value.trim()) {
      properties[prop] = { select: { name: value } };
    }
  }

  if (Array.isArray(body.q4_galeres) && body.q4_galeres.length > 0) {
    properties["Q4 Galères"] = {
      multi_select: body.q4_galeres.map((name) => ({ name })),
    };
  }

  if (body.q1_logiciel?.trim()) {
    properties["Q1 Logiciel — lequel/manque"] = {
      rich_text: [{ text: { content: body.q1_logiciel.trim().slice(0, 2000) } }],
    };
  }

  if (body.email?.trim()) {
    properties["Email"] = { email: body.email.trim() };
  }

  properties["Tenez-moi informé"] = { checkbox: Boolean(body.optin) };

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DATABASE_ID },
      properties,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Notion API error:", res.status, detail);
    return NextResponse.json(
      { error: "Échec de l'enregistrement." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
