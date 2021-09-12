import { Deepspace, Transfer as TransferEvent } from '../generated/Deepspace/Deepspace';
import { Transfer, Count } from '../generated/schema';
import { BigInt, Bytes, log } from '@graphprotocol/graph-ts';

export function handleTransfer(event: TransferEvent): void {

  let id = event.transaction.hash.toHexString() + '-' + event.transactionLogIndex.toString();
  let transfer = new Transfer(id);

  // Set properties on the entity, using the event parameters
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.value = event.params.value;
  transfer.blockNumber = event.block.number;
  transfer.timestamp = event.block.timestamp;

  log.info('Transfer {} {} {}', [transfer.id, transfer.blockNumber.toString(), transfer.timestamp.toString()]);

  // Save the entity to the store
  transfer.save()

  trackCount(transfer);
}

function trackCount(transfer: Transfer):void {
  let countTxOut = getCount(transfer.from);
  countTxOut.transfersOut++;
  countTxOut.lastTx = transfer.timestamp;
  countTxOut.save();

  let countTxIn = getCount(transfer.to);
  countTxOut.transfersIn++;
  countTxOut.lastTx = transfer.timestamp;
  countTxIn.save();
}

function getCount(address: Bytes): Count {

  let countId = address.toHexString();

  let count = Count.load(countId);
  if (count === null) {
    count = new Count(countId);
    count.transfersIn = 0;
    count.transfersOut = 0;
    count.lastTx = new BigInt(0);
  }
  return <Count>count;
}



