import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { BadgeCheck, Building2, Check, ChevronRight, Edit3, Phone, Save, UserRound, X } from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/Toast/Toast";
import "./ProfilePage.css";
export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { profile, updateProfile } = useWallet();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [bankForm, setBankForm] = useState(false);
  const [bankName, setBankName] = useState(profile.bankName || "Bank of Baroda");
  const [toast, setToast] = useState(null);
  const saveName = (event) => {
    event.preventDefault();
    if (!name.trim()) { setToast({ type: "error", message: "Name cannot be empty." }); return; }
    updateProfile({ name: name.trim() });
    setEditing(false);
    setToast({ type: "success", message: "Profile name updated." });
  };
  const saveBank = (event) => {
    event.preventDefault();
    if (!bankName.trim()) { setToast({ type: "error", message: "Enter a bank name." }); return; }
    updateProfile({ bankName: bankName.trim(), bankLinked: true });
    setBankForm(false);
    setToast({ type: "success", message: "Demo bank details updated." });
  };
  return <div className="profile-page page-enter">
    <div className="profile-intro"><span className="eyebrow">ACCOUNT SETTINGS</span><h1>Your profile</h1><p>Manage your personal and linked account details.</p></div>
    <section className="profile-hero"><div className="profile-avatar"><UserRound size={31}/></div><div className="profile-hero-copy"><span>U-PAY USER</span><h2>{profile.name}</h2><p><Phone size={13}/> +91 {profile.phone}</p></div><BadgeCheck className="profile-verified" size={22}/></section>
    <section className="profile-card">
      <div className="profile-card-heading"><h2>Personal details</h2><span>YOUR INFORMATION</span></div>
      <div className="profile-detail-row"><span className="profile-detail-icon"><UserRound size={17}/></span><div className="profile-detail-content"><label>Full name</label>{editing ? <form className="inline-edit-form" onSubmit={saveName}><input value={name} onChange={(e) => setName(e.target.value)} autoFocus/><button type="submit" aria-label="Save name"><Save size={17}/></button><button type="button" onClick={() => {setEditing(false);setName(profile.name);}} aria-label="Cancel edit"><X size={17}/></button></form> : <strong>{profile.name}</strong>}</div>{!editing && <button className="edit-profile-button" onClick={() => {setName(profile.name);setEditing(true);}}><Edit3 size={15}/> Edit</button>}</div>
      <div className="profile-detail-row"><span className="profile-detail-icon"><Phone size={17}/></span><div className="profile-detail-content"><label>Mobile number</label><strong>+91 {profile.phone}</strong><small>Mobile number cannot be edited in this demo.</small></div><span className="locked-tag">Locked</span></div>
      <div className="profile-detail-row"><span className="profile-detail-icon"><Building2 size={17}/></span><div className="profile-detail-content"><label>UPI ID</label><strong className="profile-upi">{profile.upiId}</strong></div><button className="edit-profile-button" onClick={async () => {try {await navigator.clipboard.writeText(profile.upiId);setToast({type:"success",message:"UPI ID copied."});}catch{setToast({type:"error",message:"Clipboard is not available in this browser."});}}}><span>Copy</span></button></div>
    </section>
    <section className="profile-card bank-profile-card">
      <div className="profile-card-heading"><h2>Bank account</h2><span>PAYMENT METHOD</span></div>
      <div className="bank-profile-row"><span className="bank-profile-logo"><Building2 size={21}/></span><div><strong>{profile.bankLinked ? profile.bankName : "No bank account added"}</strong><small>{profile.bankLinked ? "Linked to your UPI profile" : "Add a bank for demo payments"}</small></div><ChevronRight size={18} className="bank-chevron"/></div>
      {bankForm ? <form className="bank-edit-form" onSubmit={saveBank}><label>Bank name<input value={bankName} onChange={(e) => setBankName(e.target.value)} required placeholder="Enter bank name"/></label><div><button type="button" className="secondary-button" onClick={() => setBankForm(false)}>Cancel</button><button className="primary-button" type="submit"><Check size={15}/> Save bank</button></div></form> : <button className="profile-bank-action" onClick={() => {setBankName(profile.bankName || "Bank of Baroda");setBankForm(true);}}>{profile.bankLinked ? "Edit bank details" : "Add bank account"} <ChevronRight size={16}/></button>}
    </section>
    <section className="profile-card profile-session-card">
      <div>
        <h2>Account session</h2>
        <p>Your demo session stays on this browser so you can return without logging in again.</p>
      </div>
      <button
        type="button"
        className="profile-session-button"
        onClick={() => {
          logout();
          navigate("/", { replace: true });
        }}
      >
        Sign out of this demo
      </button>
    </section>
    <div className="profile-demo-note">This is a frontend-only demo. Your changes are saved to local browser storage and are not synced to a server.</div>
    <Toast toast={toast} onClose={() => setToast(null)}/>
  </div>;
}
