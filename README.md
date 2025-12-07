# 🎟️ Ticket Box


A decentralized ticket minting and claiming application built using the IOTA Move framework and a Next.js frontend.

##1. Project Overview

Ticket Box enables users to interact with blockchain-based event tickets through:

On-chain ticket creation using a Move smart contract.

Ticket claiming that generates a Claim object for proof of ownership.

Wallet connection and blockchain execution using IOTA dApp Kit.

A simple and minimalistic UI for interaction.

Layers included in the application:

Layer	Technology
Smart Contract	Move (IOTA Framework)
Frontend	Next.js 15+ (Turbopack)
Wallet Integration	@iota/dapp-kit
Blockchain RPC	@iota/iota-sdk

##2. Move Contract Summary
Ticket

Stores information related to an event ticket, including event name, date, seat, and price.

TicketBox

A key object that owns a Ticket instance. Each ticket minted is wrapped inside a TicketBox object and transferred to the sender.

Claim

Represents user proof after claiming a ticket. It stores the user address and a UID.

Entry Functions

create_ticket
Creates a Ticket, wraps it in a TicketBox, and transfers it to the caller.

claim_ticket
Generates a Claim object as proof that the user has successfully claimed their ticket.

#3. Network Configuration

The network configuration file connects the frontend to the correct RPC network (Devnet, Testnet, Mainnet) and loads the proper Move package ID from deployment.

The configuration exports utilities to access network variables in React components such as the package ID and client URL.

#4. Frontend Overview

Built with Next.js app directory architecture

Uses IOTA dApp Kit for wallet connection, signing, and transaction execution

UI components allow creating and claiming tickets

Move calls are executed through the connected wallet

Network configuration injects the correct package ID so the frontend can call the Move module functions

#5. How the dApp Works
Ticket Creation (Admin Use)

Event details such as event name, seat, date, and price are assembled into a Ticket object and stored inside a TicketBox object, which is transferred to the admin wallet.

Ticket Claiming (User)

Users claim their ticket, and a Claim object is created. This provides on-chain proof of ticket redemption or ownership.

#6. Troubleshooting Summary
Invalid Contract or Wrong Function

Occurs when the frontend uses the incorrect package ID or module path. Ensure the module path matches the deployed contract.

Serialization or Verification Errors

Usually caused by outdated build artifacts or incorrect type signatures. The Move contract should compile cleanly before deployment.

RPC or Network Mismatch

Happens when the frontend is connected to the wrong network or points to a different environment than where the contract is deployed.

Next.js Lock Files

Sometimes the development environment leaves stale .next/ build files. Removing them resolves issues.

GitHub Repository Ownership Warning

Happens on WSL when file ownership does not match expected user context. Adding the directory to Git safe list resolves this.
