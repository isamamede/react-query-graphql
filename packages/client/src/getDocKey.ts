import { DocumentNode } from "graphql";

// // throw error if denitions has no name;
export const getDocKey = (query: DocumentNode): string => {
  return (query.definitions[0] as any).name.value;
};
