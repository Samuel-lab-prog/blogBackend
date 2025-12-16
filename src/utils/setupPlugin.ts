import Elysia from "elysia";

export const SetupPlugin = new Elysia()
  .as('global')
  .state('userId', null as number | null) // If we have the id, we guarantee authentication
  .state('role', 'guest' as 'guest' | 'admin') // For now, we have only two roles (since only the owner exists)
  .state('reqInitiatedAt', 0)
  .state('authTiming', 0) // This is being instanciated in login and authPlugin 
  .state('reqId', '')
