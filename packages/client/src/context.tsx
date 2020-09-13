import React, { createContext, useCallback } from "react";
import { fetchGraphQL, IMiddleware, IOptions } from "./graphql-fetch";

export const GraphQLContext = createContext(undefined);

interface IGraphQLConfig {
  uri: string;
  options?: IOptions;
  middleware?: IMiddleware[];
}

function useFetchGraphQL({
  uri,
  options = {},
  middleware = [],
}: IGraphQLConfig) {
  const fetch = useCallback(
    // eslint-disable-next-line @typescript-eslint/ban-types
    async function <TData, TVariables extends object>(
      query: string,
      variables?: TVariables,
      fetchMiddleware: IMiddleware[] = [],
    ): Promise<TData> {
      return await fetchGraphQL(uri, query, variables, {
        ...options,
        middleware: [...fetchMiddleware, ...middleware],
      });
    },
    [uri, options, middleware],
  );

  return fetch;
}

export const GraphQLProvider = ({
  children,
  ...config
}: React.PropsWithChildren<IGraphQLConfig>) => {
  const fetch = useFetchGraphQL(config);
  return (
    <GraphQLContext.Provider value={fetch as any}>
      {children}
    </GraphQLContext.Provider>
  );
};
