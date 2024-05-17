// pages/api/bot-voting.js
import { z } from "zod";
import { OpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// input title, body, choices of proposal
// output reco IA of choices
export default async function handler(req, res) {
  let proposalsData = [];
  try {
    const proposalsResponse = await fetch("https://hub.snapshot.org/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operationName: "Proposals",
        query: `
          query Proposals {
            proposals(
              first: 20,
              skip: 0,
              where: {
                space_in: ["ens.eth"],
                state: "closed"
              },
              orderBy: "created",
              orderDirection: desc
            ) {
              id
              title
              body
              choices
              start
              end
              snapshot
              state
              author
              space {
                id
                name
              }
            }
          }
        `,
        variables: null,
      }),
    });

    if (!proposalsResponse.ok) {
      throw new Error(`HTTP error! status: ${proposalsResponse.status}`);
    }

    const data = await proposalsResponse.json();
    proposalsData = data.data.proposals.slice(0, 10); // Limiter aux dix premières propositions

    // Créer un analyseur de sortie structuré
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        recommendation: z.string().describe("Name of the choice"),
      })
    );

    // Créer une séquence exécutable avec un modèle de prompt et OpenAI
    const chain = RunnableSequence.from([
      PromptTemplate.fromTemplate(
        "Based on the proposal details: title, body, and choices, generate a voting recommendation.\n{format_instructions}\n{proposal}"
      ),
      new OpenAI({
        temperature: 0.7,
        openAIApiKey: process.env.OPENAI_API_KEY, // Utiliser la clé OpenAI depuis les variables d'environnement
      }),
      parser,
    ]);

    // Envoyer chaque proposition à OpenAI et obtenir des recommandations
    const openAIResponses = [];
    for (const proposal of proposalsData) {
      const response = await chain.invoke({
        proposal: `Title: ${proposal.title}\nBody: ${proposal.body}\nChoices: ${proposal.choices.join(", ")}`,
        format_instructions: parser.getFormatInstructions(),
      });
      openAIResponses.push({ proposalId: proposal.id, recommendation: response.recommendation });
    }

    // Retourner les propositions et les recommandations
    res.status(200).json({ proposals: proposalsData, recommendations: openAIResponses });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
