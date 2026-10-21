export const initialProfile = {
  name: "Mrunali Gupta",
  phone: "7359808797",
  upiId: "mrunaligupta2311@bank.com",
  bankName: "Bank of Baroda",
  balance: 500003,
  bankLinked: true
};

const today = new Date();
const dateAt = (daysAgo, hours, minutes) => {
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

export const initialTransactions = [
  { id: "tx-1", person: "Devil", amount: 400, type: "sent", date: dateAt(0, 10, 42), note: "Sent via UPI" },
  { id: "tx-2", person: "Mannu", amount: 300, type: "received", date: dateAt(0, 9, 18), note: "Received via UPI" },
  { id: "tx-3", person: "Manneswar", amount: 7000, type: "sent", date: dateAt(1, 18, 5), note: "Sent via UPI" },
  { id: "tx-4", person: "Devileshwar", amount: 4000, type: "sent", date: dateAt(2, 14, 30), note: "Sent via UPI" },
  { id: "tx-5", person: "Dingu", amount: 299, type: "sent", date: dateAt(3, 11, 12), note: "Sent via UPI" },
  { id: "tx-6", person: "Dev", amount: 5000, type: "received", date: dateAt(4, 16, 48), note: "Received via UPI" }
];

export const contacts = [
  { name: "Devil", upiId: "devil@okbank", phone: "9000000001" },
  { name: "Mannu", upiId: "mannu@okbank", phone: "9000000002" },
  { name: "Manneswar", upiId: "manneswar@okbank", phone: "9000000003" },
  { name: "Devileshwar", upiId: "devileshwar@okbank", phone: "9000000004" },
  { name: "Dingu", upiId: "dingu@okbank", phone: "9000000005" },
  { name: "Dev", upiId: "dev@okbank", phone: "9000000006" }
];
