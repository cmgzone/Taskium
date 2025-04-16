declare module 'flutterwave-node-v3' {
  export default class Flutterwave {
    constructor(publicKey: string, secretKey: string);
    
    Banks: {
      country: (countryCode: string) => Promise<any>;
    };
    
    Transaction: {
      verify: (params: { id: string }) => Promise<any>;
      verify_by_reference: (params: { tx_ref: string }) => Promise<any>;
    };
    
    Charge: {
      card: (params: any) => Promise<any>;
      bank_transfer: (params: any) => Promise<any>;
      mobile_money: (params: any) => Promise<any>;
    };
    
    Misc: {
      exchange_rates: (params: any) => Promise<any>;
    };
  }
}