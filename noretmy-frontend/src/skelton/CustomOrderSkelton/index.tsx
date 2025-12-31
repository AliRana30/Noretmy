import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const OrderCardSkeleton = () => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="pt-6">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      <Skeleton className="h-4 w-3/4 mb-2" />

      <div className="flex items-center space-x-2 text-sm mb-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="flex items-center text-lg font-semibold">
        <Skeleton className="h-5 w-5 mr-1" />
        <Skeleton className="h-5 w-16" />
      </div>
    </CardContent>
  </Card>
);

export default OrderCardSkeleton;
