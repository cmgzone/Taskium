import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Basic type for a system secret
type SystemSecret = {
  id: number;
  keyName: string;
  value: string;
  description: string | null;
  category: string;
  lastUpdatedAt: string;
  updatedById: number | null;
  isEncrypted: boolean;
};

export default function SystemSecrets() {
  const [activeTab, setActiveTab] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSecret, setNewSecret] = useState({
    keyName: "",
    value: "",
    description: "",
    category: "blockchain",
    isEncrypted: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query to fetch all system secrets
  const { data: secrets = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/system-secrets"],
    refetchOnWindowFocus: false,
  });

  // Query to fetch all categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/admin/system-secrets/categories"],
    refetchOnWindowFocus: false,
  });

  // Mutation for creating a new secret
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert keyName to key as the server expects
      const serverData = {
        keyName: data.keyName, // Include both for backward compatibility
        key: data.keyName,     // The server expects 'key'
        value: data.value,
        description: data.description,
        category: data.category,
        isEncrypted: data.isEncrypted
      };
      
      // Use apiRequest helper instead of direct fetch for better error handling
      return apiRequest('POST', '/api/admin/system-secrets', serverData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-secrets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-secrets/categories"] });
      setIsAddModalOpen(false);
      toast({
        title: "Success",
        description: "Secret created successfully!",
      });
      // Reset form
      setNewSecret({
        keyName: "",
        value: "",
        description: "",
        category: "blockchain",
        isEncrypted: true
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create secret. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a secret
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Use apiRequest helper instead of direct fetch for better error handling
      return apiRequest('DELETE', `/api/admin/system-secrets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-secrets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-secrets/categories"] });
      toast({
        title: "Success",
        description: "Secret deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete secret. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newSecret);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSecret(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNewSecret(prev => ({ ...prev, [name]: checked }));
  };

  const addLukeWalletKey = () => {
    setNewSecret({
      keyName: "LUKE_WALLET_KEY",
      value: "",
      description: "Private key for Luke's wallet used for blockchain operations. Required for token withdrawals and contract funding.",
      category: "blockchain",
      isEncrypted: true
    });
    setIsAddModalOpen(true);
  };

  const addTokenOwnerAddress = () => {
    setNewSecret({
      keyName: "TOKEN_OWNER_ADDRESS",
      value: "",
      description: "Public wallet address of the token owner. This is the address associated with the LUKE_WALLET_KEY.",
      category: "blockchain",
      isEncrypted: false
    });
    setIsAddModalOpen(true);
  };

  const addTskContractAddress = () => {
    setNewSecret({
      keyName: "TSK_CONTRACT_ADDRESS",
      value: "",
      description: "The contract address for TSK token on BSC mainnet. This is used for all token operations.",
      category: "blockchain",
      isEncrypted: false
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this secret? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading system secrets...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="mt-1 text-red-700">Failed to load system secrets. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">System Secrets Management</h2>
        <p className="text-muted-foreground">
          Manage sensitive configuration values securely.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
        <h3 className="text-amber-800 font-medium">Security Warning</h3>
        <p className="text-amber-700">
          System secrets are sensitive configuration values. Be careful when handling these values.
        </p>
      </div>
      
      {/* Blockchain Configuration Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 dark:from-blue-950/30 dark:to-purple-950/30 dark:border-blue-800 rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-medium text-blue-700 dark:text-blue-400 mb-3">Essential Blockchain Configuration</h2>
        <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
          For proper blockchain operations, please ensure these three critical system secrets are configured:
        </p>
        
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-blue-200 dark:border-blue-800 shadow-sm">
            <h3 className="font-medium text-blue-600 dark:text-blue-400">LUKE_WALLET_KEY</h3>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">Private key for the system wallet that processes withdrawals</p>
            <p className="text-xs mt-2 font-medium text-amber-600 dark:text-amber-400">Sensitive - Enable encryption!</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-green-200 dark:border-green-800 shadow-sm">
            <h3 className="font-medium text-green-600 dark:text-green-400">TOKEN_OWNER_ADDRESS</h3>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">Public address of the token owner wallet (0x...)</p>
            <p className="text-xs mt-2 font-medium">Category: blockchain</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-purple-200 dark:border-purple-800 shadow-sm">
            <h3 className="font-medium text-purple-600 dark:text-purple-400">TSK_CONTRACT_ADDRESS</h3>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">Smart contract address for the TSK token (0x...)</p>
            <p className="text-xs mt-2 font-medium">Category: blockchain</p>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          These secrets take precedence over environment variables and database settings to ensure secure and consistent blockchain operations.
        </p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            className={`px-3 py-2 rounded-md ${activeTab === "all" ? "bg-blue-100 text-blue-800" : "bg-gray-100"}`}
            onClick={() => setActiveTab("all")}
          >
            All Secrets
          </button>
          <button
            className={`px-3 py-2 rounded-md ${activeTab === "blockchain" ? "bg-blue-100 text-blue-800" : "bg-gray-100"}`}
            onClick={() => setActiveTab("blockchain")}
          >
            Blockchain
          </button>
        </div>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Secret
        </button>
      </div>

      <div className="border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(secrets) && secrets.length > 0 ? (
              secrets
                .filter(secret => activeTab === "all" || secret.category === activeTab)
                .map((secret, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{secret.keyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      •••••••••••••••
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{secret.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(secret.id)}>Delete</button>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No secrets found. Add your first secret with the button above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-medium text-blue-800">Essential Blockchain Configuration</h3>
        <p className="text-blue-700 mt-1 mb-2">
          To use blockchain functionality, you need to add these essential secrets to your system.
        </p>
        <div className="mt-3 space-y-2">
          <h4 className="font-medium text-blue-800">1. Luke Wallet Key (Private Key)</h4>
          <p className="text-sm text-blue-700">
            This is the private key for the token owner's wallet. It's used for processing withdrawals and funding the contract.
          </p>
          <button 
            className="mt-1 bg-blue-600 text-white px-4 py-2 rounded-md"
            onClick={addLukeWalletKey}
          >
            Add Luke Wallet Key
          </button>
        </div>

        <div className="mt-5 space-y-2">
          <h4 className="font-medium text-blue-800">2. Token Owner Address</h4>
          <p className="text-sm text-blue-700">
            This is the public wallet address that owns the TSK token (must correspond to the Luke wallet key above).
          </p>
          <button 
            className="mt-1 bg-blue-600 text-white px-4 py-2 rounded-md"
            onClick={addTokenOwnerAddress}
          >
            Add Token Owner Address
          </button>
        </div>

        <div className="mt-5 space-y-2">
          <h4 className="font-medium text-blue-800">3. TSK Contract Address</h4>
          <p className="text-sm text-blue-700">
            This is the deployed contract address for the TSK token on the BSC mainnet.
          </p>
          <button 
            className="mt-1 bg-blue-600 text-white px-4 py-2 rounded-md"
            onClick={addTskContractAddress}
          >
            Add TSK Contract Address
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add New Secret</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsAddModalOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Key Name</label>
                  <input
                    type="text"
                    name="keyName"
                    value={newSecret.keyName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g. API_KEY"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Value</label>
                  <textarea
                    name="value"
                    value={newSecret.value}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Secret value"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                  <textarea
                    name="description"
                    value={newSecret.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="What is this secret used for?"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    name="category"
                    value={newSecret.category}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Select a category</option>
                    {["blockchain", "payment", "api", "email", "notifications", "security", "storage", "other"].map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isEncrypted"
                    checked={newSecret.isEncrypted}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Encrypt Value (Recommended for private keys and sensitive data)
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Adding..." : "Add Secret"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}