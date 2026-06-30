"use client";

import { useState } from "react";

// ⚠️ Les valeurs DOIVENT correspondre exactement aux options de la base Notion.
const RADIO_QUESTIONS: {
  name: string;
  q: string;
  hint?: string;
  options: string[];
}[] = [
  {
    name: "q1",
    q: "Comment notez-vous une commande quand un client vous laisse son sujet ?",
    options: [
      "Cahier papier",
      "Excel / tableau",
      "Logiciel",
      "Fiches volantes",
      "De tête",
      "Autre",
    ],
  },
  {
    name: "q2_calcul",
    q: "Quand vous calculez le prix d'un encadrement, comment ça se passe ?",
    options: ["Calculette + grille papier", "Logiciel auto", "De tête", "Autre"],
  },
  {
    name: "q2_hesitation",
    q: "Quand un client hésite entre deux options (moulure A vs B, passe-partout ou non…), que se passe-t-il ?",
    options: [
      "Recalcule à la main",
      "Deux devis séparés",
      "Fourchette approximative",
      "Logiciel instantané",
      "Autre",
    ],
  },
  {
    name: "q3_retrouver",
    q: "Un client revient un an plus tard et veut « la même chose que la dernière fois ». Comment retrouvez-vous l'info ?",
    options: [
      "Anciens cahiers",
      "Logiciel / fichier",
      "Demande le ticket",
      "Pas facilement",
      "Autre",
    ],
  },
  {
    name: "q3_temps",
    q: "En moyenne, combien de temps pour retrouver une ancienne commande ?",
    options: ["Moins 1 min", "2 à 5 min", "Plus de 5 min", "Pas toujours"],
  },
  {
    name: "q5_prix",
    q: "Si un outil simple existait (saisie au comptoir, devis auto, historique en 2 sec), vous seriez prêt à payer combien par mois ?",
    options: ["Rien", "Moins de 20€", "20 à 40€", "40 à 60€", "Plus de 60€"],
  },
];

const GALERES = [
  "Recalcul devis",
  "Retrouver commande",
  "Suivi commande",
  "Prévenir client",
  "Facture / reçu",
  "Stock moulure",
  "Autre",
];

export default function Home() {
  const [radios, setRadios] = useState<Record<string, string>>({});
  const [galeres, setGaleres] = useState<string[]>([]);
  const [atelier, setAtelier] = useState("");
  const [q1Logiciel, setQ1Logiciel] = useState("");
  const [email, setEmail] = useState("");
  const [optin, setOptin] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );

  function toggleGalere(g: string) {
    setGaleres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atelier,
          q1_logiciel: q1Logiciel,
          q4_galeres: galeres,
          email,
          optin,
          ...radios,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <main className="wrap">
        <div className="done">
          <h2>Merci beaucoup 🙏</h2>
          <p>
            C'est exactement ce genre de retours qui fait la différence entre un
            outil inutile et un outil qu'on utilise vraiment.
          </p>
          {optin && (
            <p>Je vous tiendrai au courant des suites — à bientôt.</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="wrap">
      <div className="intro">
        <span className="badge">5 questions · 5 minutes · rien à vendre</span>
        <h1>Votre métier d'encadreur m'intéresse</h1>
        <p>
          Je suis ancien encadreur reconverti développeur. Je construis un outil
          pensé pour les ateliers d'encadrement — pas un logiciel de compta, pas
          un CRM générique. Vos réponses m'aident à le rendre vraiment utile.
        </p>
      </div>

      <form onSubmit={submit}>
        {RADIO_QUESTIONS.map((rq) => (
          <fieldset className="card" key={rq.name}>
            <p className="q">{rq.q}</p>
            {rq.options.map((opt) => (
              <label className="opt" key={opt}>
                <input
                  type="radio"
                  name={rq.name}
                  value={opt}
                  checked={radios[rq.name] === opt}
                  onChange={() =>
                    setRadios((prev) => ({ ...prev, [rq.name]: opt }))
                  }
                />
                {opt}
              </label>
            ))}
            {rq.name === "q1" && radios["q1"] === "Logiciel" && (
              <textarea
                placeholder="Lequel ? Et qu'est-ce qui vous manque dedans ?"
                value={q1Logiciel}
                onChange={(e) => setQ1Logiciel(e.target.value)}
              />
            )}
          </fieldset>
        ))}

        <fieldset className="card">
          <p className="q">
            Dans la gestion quotidienne, qu'est-ce qui vous pose le plus de
            problèmes ? <span className="hint">(plusieurs réponses possibles)</span>
          </p>
          {GALERES.map((g) => (
            <label className="opt" key={g}>
              <input
                type="checkbox"
                checked={galeres.includes(g)}
                onChange={() => toggleGalere(g)}
              />
              {g}
            </label>
          ))}
        </fieldset>

        <div className="card">
          <label className="field-label" htmlFor="atelier">
            Nom de votre atelier et ville{" "}
            <span className="hint">(facultatif)</span>
          </label>
          <input
            id="atelier"
            type="text"
            placeholder="Ex. Atelier Martin — Lille"
            value={atelier}
            onChange={(e) => setAtelier(e.target.value)}
          />

          <label
            className="field-label"
            htmlFor="email"
            style={{ marginTop: 16 }}
          >
            Email <span className="hint">(seulement si vous voulez un suivi)</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="vous@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="opt" style={{ marginTop: 12 }}>
            <input
              type="checkbox"
              checked={optin}
              onChange={(e) => setOptin(e.target.checked)}
            />
            Oui, tenez-moi informé(e) des suites
          </label>
        </div>

        <button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Envoi…" : "Envoyer mes réponses"}
        </button>
        {status === "error" && (
          <p className="error">
            Oups, l'envoi a échoué. Réessayez dans un instant.
          </p>
        )}
      </form>
    </main>
  );
}
