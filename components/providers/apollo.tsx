"use client"

import { createClient } from "graphql-ws";
import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { ApolloProvider } from "@apollo/client/react";


export function GraphQLProvider({ 
  chainId, 
  applicationId, 
  port, 
  children 
}: {
  chainId: string, 
  applicationId: string, 
  port: string, 
  children: React.ReactNode
  }) {
  const client = apolloClient(chainId, applicationId, port);
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

function apolloClient(chainId: string, applicationId: string, port: string) {
  const wsLink = new GraphQLWsLink(
    createClient({
      url: `ws://localhost:${port}/ws`,
    })
  );

  const httpLink = new HttpLink({
    uri: `http://localhost:${port}/chains/${chainId}/applications/${applicationId}`,
  });

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === "OperationDefinition" && definition.operation === "subscription";
    },
    wsLink,
    httpLink
  );

  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
    defaultOptions: {
      mutate: {
        errorPolicy: 'ignore',
      },
    },
  });
}
