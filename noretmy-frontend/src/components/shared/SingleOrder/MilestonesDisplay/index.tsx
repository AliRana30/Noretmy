"use client"

import React, { useEffect, useState } from 'react';
import {
  Clock,
  DollarSign,
  Check,
  MessageCircle,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SingleOrderSection from '../MilestoneOrderHandler';
import OrderTimeline from '@/components/shared/OrderTimeline';

interface Milestone {
  _id: string;
  title: string;
  deliveryTime: string;
  amount: number;
  status: string;
  deliveryDescription: string;
  requestReason: string;
  statusHistory: StatusHistory[]
}

interface StatusHistory {

  status: string;
}

interface MilestoneOrderDisplayProps {
  sellerName: string;
  sellerUsername: string;
  sellerImage: string;
  orderDetails: any;
  reviewDetails?: any;
  milestones: Milestone[];
  operationComplete: () => void
}

const MilestoneOrderDisplay: React.FC<MilestoneOrderDisplayProps> = ({
  sellerName,
  sellerUsername,
  sellerImage,
  orderDetails,
  milestones,
  reviewDetails,
  operationComplete
}) => {

  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    milestones.find(m => m.status?.toLowerCase() === 'in progress') || milestones[0]
  );

  useEffect(() => {
    const updatedMilestone = orderDetails?.milestones?.find(
      (m: Milestone) => m.status?.toLowerCase() === 'in progress'
    ) || milestones?.[0];

    setSelectedMilestone(updatedMilestone);
  }, [orderDetails]);

  const allApproved = milestones.every(m => {
    const lastStatus = m.statusHistory?.[m.statusHistory.length - 1]?.status?.toLowerCase();
    return lastStatus === 'approved';
  });

  const lastMilestoneId = milestones[milestones.length - 1]?._id;
  const isLastMilestone = selectedMilestone?._id === lastMilestoneId;

  const canReview = allApproved && isLastMilestone;

  const handleMilestoneClick = (milestone: Milestone, index: number) => {
    if (index === 0 || (milestones[index - 1] && milestones[index - 1].status?.toLowerCase() === "approved")) {
      setSelectedMilestone(milestone);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'in progress': return 'outline';
      default: return 'destructive';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-sm">
      <div className="flex items-center space-x-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={sellerImage} alt={sellerName} />
          <AvatarFallback>{sellerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{sellerName}</h2>
          <p className="text-gray-500">@{sellerUsername}</p>
        </div>
      </div>

      <div className="mb-6">
        <OrderTimeline
          status={orderDetails?.orderStatus || orderDetails?.status || 'created'}
          timeline={orderDetails?.timeline || []}
          isPaid={orderDetails?.isPaid}
          orderDate={orderDetails?.createdAt}
          deliveryDate={orderDetails?.deliveryDate}
          orderCompletionDate={orderDetails?.completedAt}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Tabs defaultValue="milestones" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="milestones">
                <Check className="mr-2 h-4 w-4" /> Milestones
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageCircle className="mr-2 h-4 w-4" /> Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="milestones">
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <Card
                    key={milestone._id}
                    className={`cursor-pointer transition-all duration-300 
                      ${selectedMilestone?._id === milestone._id
                        ? 'border-primary ring-2 ring-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50'}`}
                    onClick={() => handleMilestoneClick(milestone, index)}
                  >
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold">{milestone.title}</h4>
                        <Badge variant={getStatusVariant(milestone.status)}>
                          {milestone.status}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Delivery: {milestone.deliveryTime}</span>
                        </div>
                        <div className="flex items-center space-x-2 font-semibold text-primary">
                          <DollarSign className="h-4 w-4" />
                          <span>${milestone.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="chat">
              <div className="text-center py-12 text-gray-500">
                Chat functionality coming soon
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-2">
          {selectedMilestone ? (
            <SingleOrderSection
              sellerImage={sellerImage}
              sellerName={sellerName}
              sellerUsername={sellerUsername}
              orderDetails={orderDetails}
              reviewDetails={reviewDetails}
              selectedMilestone={selectedMilestone}
              onOperationComplete={operationComplete}
              canReview={canReview}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center p-12 text-gray-500">
                <Info className="mr-2 h-6 w-6" />
                <span>Select a milestone to view details</span>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MilestoneOrderDisplay;
