'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
  Clock,
  DollarSign,
  Plus,
  X,
  CheckCircle,
  FileText,
  Package,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import { showSuccess } from '@/util/toast';

interface Milestone {
  title: string;
  description: string;
  deliveryTime: number;
  amount: number;
}

const CreateOrderScreen = ({ buyerId }: { buyerId: string }) => {
  const [orderType, setOrderType] = useState<'Milestone' | 'Custom'>(
    'Milestone',
  );
  const [selectedGig, setSelectedGig] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestone, setMilestone] = useState<Milestone>({
    title: '',
    description: '',
    deliveryTime: 0,
    amount: 0,
  });
  const [customOrder, setCustomOrder] = useState({
    title: '',
    description: '',
    deliveryDate: '',
    price: 0,
  });
  const [gigs, setGigs] = useState<any[]>([]);
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/job/user`,
          {
            withCredentials: true, // Ensures cookies and authentication tokens are sent
          },
        );
        setGigs(response.data);
      } catch (error) {
        console.error('Error fetching gigs:', error);
      }
    };

    fetchGigs();
  }, []);
  const handleSelectGig = (id: string) => setSelectedGig(id);

  const handleAddMilestone = () => {
    if (
      milestone.title &&
      milestone.description &&
      milestone.deliveryTime > 0 &&
      milestone.amount > 0
    ) {
      setMilestones([...milestones, milestone]);
      setMilestone({ title: '', description: '', deliveryTime: 0, amount: 0 });
    }
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    const orderData = {
      custom_BuyerId: buyerId,
      gigId: selectedGig,
      type: orderType,
      milestones: orderType === 'Milestone' ? milestones : [],
      isMilestone: orderType === 'Milestone' ? true : false,
      isCustomOrder: orderType === 'Custom' ? true : false,
      price:
        orderType === 'Custom'
          ? customOrder.price
          : milestones.reduce((sum, m) => sum + m.amount, 0),
    };

    try {
     const response  =  await axios.post(
        `${BACKEND_URL}/orders`,
        orderData,
        { withCredentials: true },
      );

    if(response.status==200 || response.status ==201 || response.status == 204){
      setMilestones([]);
      setSelectedGig(null);
      setOrderType('Milestone');
      showSuccess("Milestone order request sent successfully!")
    }

    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-6 h-6" />
              Create New Order
            </CardTitle>
            <CardDescription>
              Select a gig and define your order details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Gig Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Available Gigs</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {gigs.map((gig) => (
                    <div
                      key={gig._id}
                      onClick={() => handleSelectGig(gig._id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedGig === gig._id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-200 hover:shadow-sm'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900">{gig.title}</h4>
                      {/* <p className="text-sm text-gray-500 mt-1">{gig.description}</p> */}
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Type Tabs */}
              <Tabs defaultValue="milestone" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="milestone"
                    onClick={() => setOrderType('Milestone')}
                  >
                    Milestone Based
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom"
                    onClick={() => setOrderType('Custom')}
                  >
                    Custom Order
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="milestone">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Milestone</CardTitle>
                      <CardDescription>
                        Break down your project into manageable milestones
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        placeholder="Milestone Title"
                        value={milestone.title}
                        onChange={(e) =>
                          setMilestone({ ...milestone, title: e.target.value })
                        }
                      />
                      <Textarea
                        placeholder="Description"
                        value={milestone.description}
                        onChange={(e) =>
                          setMilestone({
                            ...milestone,
                            description: e.target.value,
                          })
                        }
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-gray-500">
                            Delivery Time (days)
                          </label>
                          <Input
                            type="number"
                            value={milestone.deliveryTime}
                            onChange={(e) =>
                              setMilestone({
                                ...milestone,
                                deliveryTime: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-gray-500">
                            Amount ($)
                          </label>
                          <Input
                            type="number"
                            value={milestone.amount}
                            onChange={(e) =>
                              setMilestone({
                                ...milestone,
                                amount: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddMilestone} className="w-full">
                        <Plus className="w-4 h-4 mr-2" /> Add Milestone
                      </Button>
                    </CardContent>
                  </Card>

                  {milestones.length > 0 && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Milestones Overview</CardTitle>
                        <CardDescription>
                          Total Amount: ${totalAmount}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {milestones.map((m, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                            >
                              <div className="space-y-1">
                                <h5 className="font-medium">{m.title}</h5>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {m.deliveryTime} days
                                  </span>
                                  <span className="flex items-center">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    {m.amount}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMilestone(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="custom">
                  <Card>
                    <CardHeader>
                      <CardTitle>Custom Order Details</CardTitle>
                      <CardDescription>
                        Specify your custom order requirements
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        placeholder="Order Title"
                        value={customOrder.title}
                        onChange={(e) =>
                          setCustomOrder({
                            ...customOrder,
                            title: e.target.value,
                          })
                        }
                      />
                      <Textarea
                        placeholder="Order Description"
                        value={customOrder.description}
                        onChange={(e) =>
                          setCustomOrder({
                            ...customOrder,
                            description: e.target.value,
                          })
                        }
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="date"
                          value={customOrder.deliveryDate}
                          onChange={(e) =>
                            setCustomOrder({
                              ...customOrder,
                              deliveryDate: e.target.value,
                            })
                          }
                        />
                        <Input
                          type="number"
                          placeholder="Price"
                          value={customOrder.price}
                          onChange={(e) =>
                            setCustomOrder({
                              ...customOrder,
                              price: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Button onClick={handleSubmitOrder} className="w-full" size="lg">
                <CheckCircle className="w-5 h-5 mr-2" /> Submit Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateOrderScreen;
