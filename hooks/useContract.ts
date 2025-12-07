"use client";

import { useState } from "react";
import {
  useCurrentAccount,
  useIotaClient,
  useSignAndExecuteTransaction,
  useIotaClientQuery,
} from "@iota/dapp-kit";

import { Transaction } from "@iota/iota-sdk/transactions";
import { useNetworkVariable } from "@/lib/config";
import type { IotaObjectData } from "@iota/iota-sdk/client";

export const CONTRACT_MODULE = "ticket_box::ticket";
export const CONTRACT_METHODS = {
  CREATE: "create_ticket",
  CLAIM: "claim_ticket",
} as const;

// Hard-coded event used for minting (you can change)
const DEFAULT_EVENT = {
  name: "Music Festival 2025",
  date: "2025-12-01",
  seat: "A12",
  price: 50,
};

function bytesToString(v: number[] | Uint8Array): string {
  try {
    if (v instanceof Uint8Array) return new TextDecoder().decode(v);
    return new TextDecoder().decode(new Uint8Array(v));
  } catch {
    return String.fromCharCode(...(v as number[]));
  }
}

function getTicketBoxFields(data: IotaObjectData): any | null {
  if (data.content?.dataType !== "moveObject") return null;

  const fields = data.content.fields as Record<string, any>;
  if (!fields.ticket) return null;

  const t = fields.ticket as any;

  return {
    eventName: bytesToString(t.event_name),
    date: bytesToString(t.date),
    seat: bytesToString(t.seat),
    price: Number(t.price),
  };
}

export const useContract = () => {
  const currentAccount = useCurrentAccount();
  const address = currentAccount?.address;
  const packageId = useNetworkVariable("packageId");
  const iotaClient = useIotaClient();
  const { mutate: signAndExecute, isPending } =
    useSignAndExecuteTransaction();

  const [ticketBoxId, setTicketBoxId] = useState<string | null>(() =>
    typeof window !== "undefined" && address
      ? localStorage.getItem(`ticketBoxId_${address}`)
      : null
  );

  const [claimId, setClaimId] = useState<string | null>(() =>
    typeof window !== "undefined" && address
      ? localStorage.getItem(`claimId_${address}`)
      : null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [txError, setTxError] = useState<Error | null>(null);

  const {
    data,
    isPending: isFetching,
    error: queryError,
    refetch,
  } = useIotaClientQuery(
    "getObject",
    { id: ticketBoxId!, options: { showContent: true, showOwner: true } },
    { enabled: !!ticketBoxId }
  );

  const fields = data?.data ? getTicketBoxFields(data.data) : null;

  // --------------------------
  // CREATE TICKET — user enters buyer info, but Move expects only event fields
  // We therefore pass only the 4 expected args to moveCall and save buyer off-chain.
  // --------------------------
  const createTicket = async (
    buyerName: string,
    buyerEmail: string,
    buyerPhone: string
  ) => {
    if (!packageId) {
      setTxError(new Error("Missing packageId in config"));
      return;
    }

    try {
      setTxError(null);

      const tx = new Transaction();
      // build call: only event_name, date, seat, price (Move signature)
      tx.moveCall({
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.CREATE}`,
        arguments: [
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(DEFAULT_EVENT.name))),
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(DEFAULT_EVENT.date))),
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(DEFAULT_EVENT.seat))),
          tx.pure.u64(DEFAULT_EVENT.price),
        ],
      });

      signAndExecute(
        { transaction: tx as never },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest);
            setIsLoading(true);

            try {
              const { effects } = await iotaClient.waitForTransaction({
                digest,
                options: { showEffects: true },
              });

              const created = effects?.created ?? [];

              // find newly created TicketBox object owned by current address
              const newObj = created.find(
                (c) =>
                  typeof c.owner === "object" &&
                  c.owner !== null &&
                  "AddressOwner" in c.owner &&
                  c.owner.AddressOwner === address
              );

              const newId = newObj?.reference?.objectId;

              if (newId) {
                setTicketBoxId(newId);
                if (address) localStorage.setItem(`ticketBoxId_${address}`, newId);

                // Save buyer info off-chain mapped to this ticketBoxId
                try {
                  const booking = {
                    ticketBoxId: newId,
                    buyer: { name: buyerName, email: buyerEmail, phone: buyerPhone },
                    event: DEFAULT_EVENT,
                    createdAt: new Date().toISOString(),
                    txDigest: digest,
                  };
                  localStorage.setItem(`booking_${newId}`, JSON.stringify(booking));
                } catch {
                  // ignore storage error
                }

                await refetch();
              }
            } finally {
              setIsLoading(false);
            }
          },
          onError: (err) => {
            setTxError(err instanceof Error ? err : new Error(String(err)));
          },
        }
      );
    } catch (err) {
      setTxError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // --------------------------
  // CLAIM TICKET
  // --------------------------
  const claimTicket = async () => {
    if (!ticketBoxId || !packageId) return;

    try {
      setTxError(null);

      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.CLAIM}`,
        arguments: [tx.object(ticketBoxId)],
      });

      signAndExecute(
        { transaction: tx as never },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest);
            setIsLoading(true);

            try {
              const { effects } = await iotaClient.waitForTransaction({
                digest,
                options: { showEffects: true },
              });

              const created = effects?.created ?? [];

              const newObj = created.find(
                (c) =>
                  typeof c.owner === "object" &&
                  c.owner !== null &&
                  "AddressOwner" in c.owner &&
                  c.owner.AddressOwner === address
              );

              const newId = newObj?.reference?.objectId;

              if (newId) {
                setClaimId(newId);
                if (address) localStorage.setItem(`claimId_${address}`, newId);

                // also map claim => ticketBox (handy)
                try {
                  localStorage.setItem(`claim_to_ticket_${newId}`, ticketBoxId ?? "");
                } catch {}
              }

              await refetch();
            } finally {
              setIsLoading(false);
            }
          },
          onError: (err) => {
            setTxError(err instanceof Error ? err : new Error(String(err)));
          },
        }
      );
    } catch (err) {
      setTxError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return {
    data: fields,
    ticketBoxId,
    claimId,
    actions: { createTicket, claimTicket },
    state: {
      isLoading,
      isPending,
      hash,
      isConfirmed: !!hash && !isLoading && !isPending,
      error: txError || queryError,
    },
    hasValidData: !!fields,
    isFetching,
  };
};
