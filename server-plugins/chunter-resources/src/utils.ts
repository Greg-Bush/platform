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
import { Account, Doc, Hierarchy, Ref, Tx, TxCreateDoc, TxCUD, TxProcessor } from '@hcengineering/core'
import { NotificationType } from '@hcengineering/notification'
import { TriggerControl } from '@hcengineering/server-core'
import chunter, { Backlink, DirectMessage } from '@hcengineering/chunter'
import contact, { Person } from '@hcengineering/contact'
import core from '@hcengineering/core/lib/component'
import activity from '@hcengineering/activity'

/**
 * @public
 */
export async function IsChannelMessage (
  tx: Tx,
  doc: Doc,
  user: Ref<Account>,
  type: NotificationType,
  control: TriggerControl
): Promise<boolean> {
  const hierarchy = control.hierarchy
  const isDirect = await IsDirectMessage(tx, doc, user, type, control)

  if (isDirect) {
    return false
  }

  return hierarchy.isDerived(doc._class, chunter.class.Channel) || hierarchy.hasMixin(doc, activity.mixin.ActivityDoc)
}

/**
 * @public
 */
export async function IsMeMentioned (
  originTx: Tx,
  doc: Doc,
  user: Ref<Account>,
  type: NotificationType,
  control: TriggerControl
): Promise<boolean> {
  const tx = TxProcessor.extractTx(originTx) as TxCUD<Backlink>
  if (!isBacklink(tx, control.hierarchy)) {
    return false
  }
  const backlink = TxProcessor.createDoc2Doc(tx as TxCreateDoc<Backlink>)

  if (!control.hierarchy.isDerived(backlink.attachedToClass, contact.class.Person)) {
    return false
  }
  const acc = (
    await control.modelDb.findAll(contact.class.PersonAccount, { person: backlink.attachedTo as Ref<Person> })
  )[0]
  return acc._id === user
}

/**
 * @public
 */
export async function IsThreadMessage (tx: TxCreateDoc<Doc>): Promise<boolean> {
  return tx.objectClass === chunter.class.ThreadMessage
}

/**
 * @public
 */
export async function IsDirectMessage (
  tx: Tx,
  doc: Doc,
  user: Ref<Account>,
  type: NotificationType,
  control: TriggerControl
): Promise<boolean> {
  const dm = (await control.findAll(chunter.class.DirectMessage, { _id: doc._id as Ref<DirectMessage> }))[0]
  return dm !== undefined
}

function isBacklink (tx: TxCUD<Backlink>, hierarchy: Hierarchy): boolean {
  if (tx._class !== core.class.TxCreateDoc) {
    return false
  }

  return hierarchy.isDerived(tx.objectClass, chunter.class.Backlink)
}
