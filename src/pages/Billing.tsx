// src/pages/Billing.tsx
import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, Download, Calendar, Save, ChevronDown, User } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const Billing: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ledgerHTML, setLedgerHTML] = useState('');
    const [selectedBillForModal, setSelectedBillForModal] = useState<any | null>(null);

    const [isGeneratingBills, setIsGeneratingBills] = useState(false);
    const [isSavingBills, setIsSavingBills] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    useEffect(() => {
        fetchMonthlyBills(selectedMonth);
    }, [selectedMonth]);

    const fetchMonthlyBills = async (month: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/daily-updates/monthly-bills?month=${month}`);
            if (!response.ok) {
                throw new Error('Failed to fetch bills');
            }
            const data = await response.json();
            setBills(data);
        } catch (err: any) {
            setError(err.message);
            toast.error('Failed to fetch bills');
        } finally {
            setLoading(false);
        }
    };

    const updateBillStatus = async (customerId: string, newPaidStatus: boolean) => {
        setUpdatingStatusId(customerId);
        try {
            const billData = {
                customer_id: customerId,
                bill_month: selectedMonth,
                paid_status: newPaidStatus,
                sent_status: false, // You can modify this as needed
                bill_amount: bills.find(b => b.customer_id === customerId)?.bill_amount || 0,
                total_cans: bills.find(b => b.customer_id === customerId)?.total_cans_delivered || 0,
                delivery_days: bills.find(b => b.customer_id === customerId)?.total_delivery_days || 0,
            };

            const response = await fetch('/api/bills/save-monthly-bills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bills: [billData] }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update bill status');
            }

            // Update local state
            setBills(prevBills =>
                prevBills.map(bill =>
                    bill.customer_id === customerId
                        ? { ...bill, paid_status: newPaidStatus }
                        : bill
                )
            );

            toast.success(`Bill status updated to ${newPaidStatus ? 'Paid' : 'Unpaid'}`);
        } catch (error: any) {
            console.error('Error updating bill status:', error);
            toast.error(`Failed to update status: ${error.message}`);
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const generatePdfForBill = async (bill: any, currentPrice: any) => {
        let ledgerData = [];
        try {
            const response = await fetch(`/api/daily-updates/ledger?customer_id=${bill.customer_id}&month=${selectedMonth}`);
            if (!response.ok) {
                throw new Error('Failed to fetch ledger data for PDF');
            }
            ledgerData = await response.json();
        } catch (err) {
            console.error(`Error fetching ledger data for ${bill.name}:`, err);
            toast.error(`Failed to get ledger for ${bill.name}. Bill might be incomplete.`, { id: `ledger-fetch-${bill.customer_id}` });
            return null;
        }

        try {
            const pdfResponse = await fetch('/generate-bill-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bill: bill,
                    ledgerData: ledgerData,
                    currentPrice: currentPrice,
                    selectedMonth: selectedMonth,
                }),
            });

            if (!pdfResponse.ok) {
                const errorText = await pdfResponse.text();
                throw new Error(`Server error: ${pdfResponse.status} ${pdfResponse.statusText} - ${errorText}`);
            }

            return pdfResponse.blob();
        } catch (error) {
            console.error("Error generating PDF via backend:", error);
            throw error;
        }
    };

    const handleGenerateAllBills = async () => {
        setIsGeneratingBills(true);
        const generationToastId = toast.loading('Preparing to generate bills...');

        try {
            const pricesResponse = await fetch('/api/settings/prices');
            if (!pricesResponse.ok) {
                throw new Error('Failed to fetch prices for bill generation.');
            }
            const prices = await pricesResponse.json();
            const currentPrice = prices[0];

            if (!currentPrice) {
                toast.error('Current pricing data not found. Cannot generate bills.', { id: generationToastId });
                setIsGeneratingBills(false);
                return;
            }

            const zip = new JSZip();
            const pdfGenerationPromises = filteredBills.map(async (bill) => {
                const billToastId = toast.loading(`Generating bill for ${bill.name}...`, { duration: 0 });
                try {
                    const pdfBlob = await generatePdfForBill(bill, currentPrice);
                    if (pdfBlob) {
                        const filename = `${bill.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-')}-bill.pdf`;
                        zip.file(filename, pdfBlob);
                        toast.success(`Bill generated for ${bill.name}`, { id: billToastId });
                    } else {
                        toast.error(`Could not generate PDF for ${bill.name}.`, { id: billToastId });
                    }
                } catch (error) {
                    console.error(`Error generating PDF for ${bill.name}:`, error);
                    toast.error(`Failed to generate bill for ${bill.name}.`, { id: billToastId });
                }
            });

            await Promise.all(pdfGenerationPromises);

            if (Object.keys(zip.files).length === 0) {
                toast.error('No PDFs were successfully generated to zip.', { id: generationToastId });
                setIsGeneratingBills(false);
                return;
            }

            const [year, monthNum] = selectedMonth.split('-');
            const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' });
            const zipFilename = `${monthName.replace(/[^a-zA-Z0-9]/g, '').trim()}-${year}-bills.zip`;

            toast.loading('Zipping bills...', { id: generationToastId });
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, zipFilename);
            toast.success('All bills zipped and downloaded!', { id: generationToastId, duration: 3000 });

        } catch (mainError) {
            console.error('Error in overall bill generation process:', mainError);
            toast.error(`Error generating all bills: ${mainError instanceof Error ? mainError.message : String(mainError)}`, { id: generationToastId });
        } finally {
            setIsGeneratingBills(false);
        }
    };

    const handleSaveAllBillsToDB = async () => {
        setIsSavingBills(true);
        const saveToastId = toast.loading('Saving bills to database...');

        if (filteredBills.length === 0) {
            toast.error('No bills to save for the selected month.', { id: saveToastId });
            setIsSavingBills(false);
            return;
        }

        const billsToSave = filteredBills.map(bill => ({
            customer_id: bill.customer_id,
            bill_month: selectedMonth,
            paid_status: bill.paid_status || false,
            sent_status: false,
            bill_amount: bill.bill_amount,
            total_cans: bill.total_cans_delivered,
            delivery_days: bill.total_delivery_days,
        }));

        try {
            const response = await fetch('/api/bills/save-monthly-bills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bills: billsToSave }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save bills to database.');
            }

            toast.success('All bills saved successfully to database!', { id: saveToastId, duration: 3000 });
            fetchMonthlyBills(selectedMonth);

        } catch (error: any) {
            console.error('Error saving bills to database:', error);
            toast.error(`Failed to save bills: ${error.message || 'Unknown error'}`, { id: saveToastId });
        } finally {
            setIsSavingBills(false);
        }
    };

    const openLedger = async (bill: any) => {
        try {
            setSelectedBillForModal(bill);
            setIsModalOpen(true);

            const pricesResponse = await fetch('/api/settings/prices');
            if (!pricesResponse.ok) {
                throw new Error('Failed to fetch prices');
            }
            const prices = await pricesResponse.json();
            const currentPrice = prices[0];

            const response = await fetch(`/api/daily-updates/ledger?customer_id=${bill.customer_id}&month=${selectedMonth}`);
            if (!response.ok) {
                throw new Error('Failed to fetch ledger data');
            }
            const ledgerData = await response.json();

            const [year, monthNum] = selectedMonth.split('-');
            const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' });

            // Create a Map for easy lookup of delivered quantity by day
            const dailyDeliveries = new Map();
            ledgerData.forEach((entry: { date: string | number | Date; delivered_qty: any; }) => {
                const date = new Date(entry.date);
                const day = date.getDate();
                dailyDeliveries.set(day, entry.delivered_qty);
            });

            const pricePerCan = bill.customer_type === 'shop' ? currentPrice.shop_price :
                bill.customer_type === 'monthly' ? currentPrice.monthly_price :
                    currentPrice.order_price;

            const totalCans = ledgerData.reduce((sum: number, d: { delivered_qty: any; }) => sum + Number(d.delivered_qty), 0);
            const totalAmount = totalCans * pricePerCan;

            // Determine the number of days in the selected month
            const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();

            const calendarHTML = `
            <!DOCTYPE html>
            <html>
            <head>
            <title>Customer Ledger - ${bill.name} (${monthName} ${year})</title>
            <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-white p-4">
            <div class="max-w-xl mx-auto border border-black p-4">
                <div class="flex justify-between items-center border-b border-black pb-2 mb-2">
                <div class="text-left text-xs">
                    <div class="font-bold text-blue-900 text-lg">कंचन मिनरल वाटर</div>
                    <div>5, लेबर कॉलोनी, नई आबादी, मंदसौर</div>
                    <div>Ph.: 07422-408555 Mob.: 9425033995</div>
                </div>
                <div class="text-center text-xs">
                    <div class="font-bold text-blue-900 text-lg">कंचन चिल्ड वाटर</div>
                    <div>साई मंदिर के पास, अभिनन्दन नगर, मंदसौर</div>
                    <div>Mob.: 9685753343, 9516784779</div>
                </div>
                </div>

                <div class="grid grid-cols-2 text-sm border-b border-black pb-1 mb-2">
                <div>मो.: ${bill.phone_number}</div>
                <div class="text-right">दिनांक: ${(new Date()).getDate()} ${monthName} ${year}</div>
                <div class="col-span-2">श्रीमान: ${bill.name}</div>
                </div>

                <table class="w-full text-xs border border-black border-collapse">
                <thead>
                    <tr>
                    <th class="border border-black p-1">दिनांक</th>
                    <th class="border border-black p-1">संख्या</th>
                    <th class="border border-black p-1">केन वापसी</th>
                    <th class="border border-black p-1">दिनांक</th>
                    <th class="border border-black p-1">संख्या</th>
                    <th class="border border-black p-1">केन वापसी</th>
                    </tr>
                </thead>
                <tbody>
                    ${Array.from({ length: Math.ceil(daysInMonth / 2) }, (_, i) => { // Iterate up to half the days in the month
                        const dayLeft = i + 1;
                        const dayRight = i + 1 + Math.ceil(daysInMonth / 2); // Calculate the right column's day

                        const deliveredQtyLeft = dailyDeliveries.get(dayLeft) || '';
                        const deliveredQtyRight = (dayRight <= daysInMonth) ? (dailyDeliveries.get(dayRight) || '') : '';

                        return `
                            <tr>
                                <td style="border: 1px solid black; padding: 0.25rem; text-align: center;">${dayLeft}</td>
                                <td style="border: 1px solid black; padding: 0.25rem; text-align: center;">${deliveredQtyLeft}</td>
                                <td style="border: 1px solid black; padding: 0.25rem;"></td>
                                <td style="border: 1px solid black; padding: 0.25rem; text-align: center;">${dayRight <= daysInMonth ? dayRight : ''}</td>
                                <td style="border: 1px solid black; padding: 0.25rem; text-align: center;">${deliveredQtyRight}</td>
                                <td style="border: 1px solid black; padding: 0.25rem;"></td>
                            </tr>`;
                    }).join('')}
                </tbody>
                </table>

                <div class="flex justify-between items-center border-t border-black mt-2 pt-1 text-sm">
                <div class="text-xs">
                    <div>नोट: प्रति माह 12 केन लेना अनिवार्य है।</div>
                    <div>* अगर कार्ड के पोस्ट मान्य नहीं होगा।</div>
                    <div>* केन 1 दिन से अधिक रखने पर प्रति दिन 10 रुपये चार्ज लगेगा।</div>
                </div>
                <div class="text-right font-bold border border-black px-2 py-1 text-xs">
                    <div>कुल केन: ${totalCans}</div>
                    <div>कुल राशि: ₹${totalAmount}</div>
                </div>
                </div>
            </div>
            </body>
            </html>
            `;
            setLedgerHTML(calendarHTML);
            setIsModalOpen(true);
        } catch (err) {
            console.error("Error in openLedger:", err);
            toast.error('Failed to fetch ledger data for modal');
        }
    };

    const filteredBills = bills.filter(bill => {
        const matchesSearch = bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.phone_number.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'paid' && bill.paid_status) ||
            (filterStatus === 'unpaid' && !bill.paid_status);
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return <div>Loading billing data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Billing Management</h1>
                    <p className="mt-2 text-sm text-gray-600">Manage customer bills and track monthly deliveries</p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-3 sm:mt-0">
                    <Button
                        variant="primary"
                        icon={<CreditCard size={16} />}
                        onClick={handleGenerateAllBills}
                        disabled={isGeneratingBills}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        {isGeneratingBills ? (
                            <>
                                <div className="spinner" style={{ border: '3px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}></div>
                                Generating...
                            </>
                        ) : (
                            'Download Bills'
                        )}
                    </Button>
                    <Button
                        variant="success"
                        icon={<Save size={16} />}
                        onClick={handleSaveAllBillsToDB}
                        disabled={isSavingBills || isGeneratingBills}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                        {isSavingBills ? (
                            <>
                                <div className="spinner" style={{ border: '3px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}></div>
                                Saving...
                            </>
                        ) : (
                            'Generate Bills'
                        )}
                    </Button>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>

            <Card className="shadow-lg border-0">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search bills..."
                            className="pl-10 pr-3 py-3 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="sm:w-48">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="month"
                                className="pl-10 pr-3 py-3 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="sm:w-48">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                className="pl-10 pr-3 py-3 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'paid' | 'unpaid')}
                            >
                                <option value="all">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="unpaid">Unpaid</option>
                            </select>
                        </div>
                    </div>

                    <Button
                        variant="secondary"
                        icon={<Download size={16} />}
                        className="sm:w-auto"
                    >
                        Export Data
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Customer Details
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Type
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Total Cans
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Delivery Days
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBills.map((bill) => (
                                <tr key={bill.customer_id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-white" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-semibold text-gray-900">{bill.name}</div>
                                                <div className="text-sm text-gray-500">{bill.phone_number}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <span className="font-medium capitalize">{bill.customer_type}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <span className="font-semibold text-blue-600">{bill.total_cans_delivered}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <span className="font-semibold text-green-600">{bill.total_delivery_days}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <span className="font-bold text-purple-600">₹{bill.bill_amount}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="relative">
                                            <select
                                                className={`px-4 py-2 text-xs leading-5 font-semibold rounded-full border-0 focus:ring-2 focus:ring-offset-2 cursor-pointer transition-all duration-200 ${
                                                    bill.paid_status
                                                        ? 'bg-green-100 text-green-800 focus:ring-green-500'
                                                        : 'bg-red-100 text-red-800 focus:ring-red-500'
                                                }`}
                                                value={bill.paid_status ? 'paid' : 'unpaid'}
                                                onChange={(e) => updateBillStatus(bill.customer_id, e.target.value === 'paid')}
                                                disabled={updatingStatusId === bill.customer_id}
                                            >
                                                <option value="paid">Paid</option>
                                                <option value="unpaid">Unpaid</option>
                                            </select>
                                            {updatingStatusId === bill.customer_id && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => openLedger(bill)}
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                        >
                                            View Ledger
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-6 relative">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    ✖
                                </button>
                                <div dangerouslySetInnerHTML={{ __html: ledgerHTML }} />
                            </div>
                        </div>
                    )}
                </div>

                {filteredBills.length === 0 && (
                    <div className="text-center py-12">
                        <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No bills found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            No bills found for the selected month and criteria.
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Billing;