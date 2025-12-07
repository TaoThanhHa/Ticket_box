module ticket_box::ticket {
    use std::vector;
    use iota::object;
    use iota::tx_context;
    use iota::transfer;

    // Ticket stored in TicketBox
    public struct Ticket has store {
        event_name: vector<u8>,
        date: vector<u8>,
        seat: vector<u8>,
        price: u64,
    }

    // Object holding a ticket
    public struct TicketBox has key, store {
        id: object::UID,
        ticket: Ticket,
    }

    // Claim after booking
    public struct Claim has key, store {
        id: object::UID,
        user: address,
    }

    // mint ticket: only ticket info
    public entry fun create_ticket(
        event_name: vector<u8>,
        date: vector<u8>,
        seat: vector<u8>,
        price: u64,
        ctx: &mut tx_context::TxContext
    ) {
        let sender = tx_context::sender(ctx);

        let t = Ticket {
            event_name,
            date,
            seat,
            price,
        };

        transfer::public_transfer(
            TicketBox { id: object::new(ctx), ticket: t },
            sender
        );
    }

    // Claim (no buyer info needed)
    public entry fun claim_ticket(
        ticket_box: &TicketBox,
        ctx: &mut tx_context::TxContext
    ) {
        let user = tx_context::sender(ctx);
        transfer::public_transfer(
            Claim { id: object::new(ctx), user },
            user
        );
    }
}
