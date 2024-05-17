import React, { useEffect, useState } from 'react';

const SnapshotProposals = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState({});

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch("/api/bot-voting");
        const data = await response.json();
        setProposals(data)
        console.log(data)
        // setAnalysis(data.response);

        // Assuming you have another function to fetch proposals from Snapshot
        // const proposalsResponse = await fetch("https://hub.snapshot.org/graphql", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify({
        //     operationName: "Proposals",
        //     query: `
        //       query Proposals {
        //         proposals(
        //           first: 20,
        //           skip: 0,
        //           where: {
        //             space_in: ["ens.eth"],
        //             state: "closed"
        //           },
        //           orderBy: "created",
        //           orderDirection: desc
        //         ) {
        //           id
        //           title
        //           body
        //           choices
        //           start
        //           end
        //           snapshot
        //           state
        //           author
        //           space {
        //             id
        //             name
        //           }
        //         }
        //       }
        //     `,
        //     variables: null,
        //   }),
        // });

        // if (!proposalsResponse.ok) {
        //   throw new Error(`HTTP error! status: ${proposalsResponse.status}`);
        // }

        // const proposalsData = await proposalsResponse.json();
        // setProposals(proposalsData.data.proposals);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>ENS Proposals</h1>
        {proposals?.proposals?.map((proposal, index) => (
          <div key={proposal.id}>
            <h2>{proposal.title}</h2>
            <p><strong>Choices:</strong> {proposal.choices.join(', ')}</p>
            <p><strong>Author:</strong> {proposal.author}</p>
            <p><strong>Recommandation IA:</strong> {proposals.recommendations[index].recommendation}</p>
          </div>
        ))}
    </div>
  );
};

export default SnapshotProposals;
