import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";

export default function Redeemed() {
  return (
    <div className="max-w-md">
      <Card className="bg-mint-soft border border-mint">
        <CardTitle>Voucher activated</CardTitle>
        <CardSubtitle>
          Show this confirmation at the partner location to redeem. Enjoy the
          evening — and tell us how it went when you&rsquo;re back.
        </CardSubtitle>
      </Card>
    </div>
  );
}
