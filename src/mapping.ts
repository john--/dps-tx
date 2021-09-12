import { Deepspace, Transfer as TransferEvent } from '../generated/Deepspace/Deepspace';
import { Transfer, Count } from '../generated/schema';
import { BigInt, Bytes, Address, log } from '@graphprotocol/graph-ts';

const ignoredAddresses: Array<string> = 
[
  '0x0000000000000000000000000000000000000000',
  '0x000000000000000000000000000000000000dead'
];

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

  if (!isAddressIgnored(transfer.from)) {
    let count = getCount(transfer.from);
    count.numTransfersOut++;
    count.totalOut = count.totalOut.plus(transfer.value);
    count.lastTx = transfer.timestamp;
    count.save();
  }

  if (!isAddressIgnored(transfer.to)) {
    let count = getCount(transfer.to);
    count.numTransfersIn++;
    count.totalIn = count.totalIn.plus(transfer.value);
    count.lastTx = transfer.timestamp;
    count.save();
  }
}

function getCount(address: Bytes): Count {

  let countId = address.toHexString();

  let count = Count.load(countId);
  if (count === null) {
    count = new Count(countId);
    count.numTransfersIn = 0;
    count.numTransfersOut = 0;
    count.totalIn = new BigInt(0);
    count.totalOut = new BigInt(0);
    count.lastTx = new BigInt(0);
  }
  return <Count>count;
}

function isAddressIgnored(address: Bytes):boolean {
  return ignoredAddresses.includes(address.toHexString());
}



