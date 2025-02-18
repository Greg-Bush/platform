//
// Copyright © 2023 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import { WorkspaceId, generateId } from '@hcengineering/core'
import { decodeToken } from '@hcengineering/server-token'
import { onAuthenticatePayload } from '@hocuspocus/server'
import { ClientFactory, Controller, getClientFactory } from './platform'

export interface Context {
  connectionId: string
  workspaceId: WorkspaceId
  clientFactory: ClientFactory
  initialContentId: string
  targetContentId: string
}

interface WithContext {
  context: any
}

export type withContext<T extends WithContext> = Omit<T, 'context'> & {
  context: Context
}

export function buildContext (data: onAuthenticatePayload, controller: Controller): Context {
  const connectionId = generateId()
  const decodedToken = decodeToken(data.token)
  const initialContentId = data.requestParameters.get('initialContentId') as string
  const targetContentId = data.requestParameters.get('targetContentId') as string

  const context: Context = {
    connectionId,
    workspaceId: decodedToken.workspace,
    clientFactory: getClientFactory(decodedToken, controller),
    initialContentId: initialContentId ?? '',
    targetContentId: targetContentId ?? ''
  }

  return context
}
