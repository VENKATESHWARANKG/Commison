import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

// Onboarding flow
import BusinessDetailsScreen from '../screens/BusinessDetailsScreen';
import CategoryRoleScreen from '../screens/CategoryRoleScreen';
import CreateAccountScreen from '../screens/CreateAccountScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';
import SetupCompleteScreen from '../screens/SetupCompleteScreen';
import SignInScreen from '../screens/SignInScreen';

// Main app - tabs
import DashboardScreen from '../screens/DashboardScreen';
import InvoicesScreen from '../screens/InvoicesScreen';
import PartiesScreen from '../screens/PartiesScreen';
import PaymentsScreen from '../screens/PaymentsScreen';

// Main app - pushed screens
import AddBuyerScreen from '../screens/AddBuyerScreen';
import AddSellerScreen from '../screens/AddSellerScreen';
import AddTransporterScreen from '../screens/AddTransporterScreen';
import CreateInvoiceScreen from '../screens/CreateInvoiceScreen';
import CreateLedgerScreen from '../screens/CreateLedgerScreen';
import CreatePaymentScreen from '../screens/CreatePaymentScreen';
import RecordExpenseScreen from '../screens/RecordExpenseScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ViewLRsScreen from '../screens/ViewLRsScreen';
import ViewReturnsScreen from '../screens/ViewReturnsScreen';

import { dataStore } from '../app/utils/dataStore';
import { isReturn, nextDocNumber } from '../app/utils/invoiceHelpers';
import MenuDrawer from '../components/MenuDrawer';
import CreateOrderScreen from '../screens/CreateOrderScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ViewOrdersScreen from '../screens/ViewOrdersScreen';

export default function App() {
  // ---- Onboarding state ----
  // 'welcome' | 'signin' | 'otp' | 'createAccount' | 'businessDetails' | 'categoryRole' | 'setupComplete' | 'app'
  const [screen, setScreen] = useState('welcome');
  const [history, setHistory] = useState([]);
  const [mobile, setMobile] = useState('');
  const [userName, setUserName] = useState('');
  const [profile, setProfile] = useState(null); // { name, mobile, email, businessName, businessType, city, state, categories, role }

  // ---- Main app state ----
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'invoices' | 'parties' | 'payments' | 'profile'
  const [stack, setStack] = useState([]); // pushed full screens, last item on top
  const [menuVisible, setMenuVisible] = useState(false); // the side menu opened from the dashboard's ☰

  const stackScreen = stack.length > 0 ? stack[stack.length - 1] : null;

  // ---- Onboarding navigation helpers ----
  const go = (next) => {
    setHistory((h) => [...h, screen]);
    setScreen(next);
  };
  const goBack = () => {
    if (history.length === 0) return false;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setScreen(prev);
    return true;
  };
  const resetTo = (next) => {
    setHistory([]);
    setScreen(next);
  };

  // ---- Main app navigation helpers ----
  const push = (key) => setStack((s) => [...s, key]);
  const pop = () => setStack((s) => s.slice(0, -1));

  const goToTab = (tabKey) => {
    setStack([]);
    setActiveTab(tabKey);
  };

  const handleLogout = () => {
    setProfile(null);
    setUserName('');
    setMobile('');
    setMenuVisible(false);
    setStack([]);
    setActiveTab('home');
    resetTo('welcome');
  };

  // A few Quick Action keys correspond to switching tabs rather than pushing a full-screen form
  const handleQuickAction = (key) => {
    if (key === 'viewPayments') {
      setStack([]);
      setActiveTab('payments');
      return;
    }
    push(key);
  };

  // ---- Hardware / system back button (Android) ----
  useEffect(() => {
    const onHardwareBack = () => {
      if (screen === 'app') {
        if (menuVisible) {
          setMenuVisible(false);
          return true;
        }
        if (stack.length > 0) {
          pop();
          return true;
        }
        if (activeTab !== 'home') {
          setActiveTab('home');
          return true;
        }
        return false;
      }
      if (screen === 'setupComplete') return true;
      if (goBack()) return true;
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  });

  // ---------------------------------------------------------------
  // ONBOARDING SCREENS
  // ---------------------------------------------------------------
  if (screen === 'welcome') {
    return <LoginScreen onLoginPress={() => go('signin')} />;
  }

  if (screen === 'signin') {
    return (
      <SignInScreen
        onBack={goBack}
        onSendOtp={(mobileNumber) => { setMobile(mobileNumber); go('otp'); }}
        onGoogleSignIn={() => console.log('Google sign-in tapped')}
        onSignUp={() => go('createAccount')}
      />
    );
  }

  if (screen === 'otp') {
    return (
      <OtpScreen
        mobile={mobile}
        onBack={goBack}
        onVerify={async (code) => {
          console.log('Verifying OTP', code, 'for', mobile);
          // TODO: call your verify-OTP API. If this mobile number has no account yet,
          // send them to 'createAccount' instead; otherwise go straight to the app.
          const stored = await dataStore.profile.get();
          if (stored && (!stored.mobile || stored.mobile === mobile)) {
            setProfile(stored);
            setUserName((stored.name || '').split(' ')[0]);
          }
          resetTo('app');
        }}
        onResend={() => console.log('Resending OTP to', mobile)}
      />
    );
  }

  if (screen === 'createAccount') {
    return (
      <CreateAccountScreen
        onBack={goBack}
        onContinue={(details) => {
          console.log('Account details', details);
          setUserName(details.name.split(' ')[0]);
          setProfile((p) => ({ ...p, name: details.name, mobile: details.mobile, email: details.email }));
          go('businessDetails');
        }}
        onLoginPress={() => resetTo('welcome')}
      />
    );
  }

  if (screen === 'businessDetails') {
    return (
      <BusinessDetailsScreen
        onBack={goBack}
        onContinue={(details) => {
          console.log('Business details', details);
          setProfile((p) => ({ ...p, ...details }));
          go('categoryRole');
        }}
      />
    );
  }

  if (screen === 'categoryRole') {
    return (
      <CategoryRoleScreen
        onBack={goBack}
        onFinishSetup={async (data) => {
          console.log('Setup finished', data);
          const complete = { ...profile, categories: data.categories, role: data.role };
          setProfile(complete);
          await dataStore.profile.set(complete); // kept on this device so it's there next time
          go('setupComplete');
        }}
      />
    );
  }

  if (screen === 'setupComplete') {
    return <SetupCompleteScreen onGoToDashboard={() => resetTo('app')} />;
  }

  // ---------------------------------------------------------------
  // MAIN APP (screen === 'app')
  // ---------------------------------------------------------------
  if (stackScreen === 'createInvoice') {
    return (
      <CreateInvoiceScreen
        onBack={pop}
        onSave={async (saved) => {
          // The screen sends one record per invoice (several when "Without Invoice" has multiple entries)
          const records = Array.isArray(saved) ? saved : [saved];
          for (const record of records) {
            let id = record.id;
            if (!id) {
              const existing = await dataStore.invoices.getAll();
              const billed = record.withInvoice !== false;
              id = isReturn(record)
                ? nextDocNumber(existing, billed ? 'RET' : 'NBR', 1001)
                : nextDocNumber(existing, billed ? 'INV' : 'NB', billed ? 10024 : 1001);
            }
            await dataStore.invoices.add({ ...record, id });
          }
          pop();
        }}
      />
    );
  }

  if (stackScreen === 'createLedger') {
    return (
      <CreateLedgerScreen
        onBack={pop}
        onSave={async (ledger) => {
          await dataStore.ledgers.add(ledger);
          // Sundry Debtors = parties who owe you (your Buyers); Sundry Creditors = parties you owe (your Sellers).
          // Registering them here too means they immediately show up on the Parties screen.
          if (ledger.ledgerGroup === 'Sundry Debtors') {
            await dataStore.buyers.add({ name: ledger.ledgerName, mobile: '' });
          } else if (ledger.ledgerGroup === 'Sundry Creditors') {
            await dataStore.sellers.add({ name: ledger.ledgerName, mobile: '' });
          }
          pop();
        }}
      />
    );
  }

  if (stackScreen === 'createPayment') {
    return (
      <CreatePaymentScreen
        onBack={pop}
        onSave={async (saved) => {
          // One payment, or several when a multiple-invoice payment has different dates per invoice
          const items = Array.isArray(saved) ? saved : [saved];
          for (const item of items) {
            if (item.entryType === 'settlement' || item.entryType === 'journal') {
              // Settlements are kept apart from payments; each gets a reference number (STL-…)
              const existing = await dataStore.journals.getAll();
              await dataStore.journals.add({ ...item, id: item.id || nextDocNumber(existing, 'STL', 1001) });
            } else {
              // Payments (PAY-…), receipts (RCT-…) and contras (CON-…) share one list, each with its own reference number
              const existing = await dataStore.payments.getAll();
              const prefix = item.voucherType === 'Contra' ? 'CON' : item.direction === 'in' ? 'RCT' : 'PAY';
              await dataStore.payments.add({ ...item, id: item.id || nextDocNumber(existing, prefix, 1001) });
            }
          }
          pop();
        }}
      />
    );
  }

  if (stackScreen === 'viewInvoices') {
    return (
      <InvoicesScreen
        showTabBar={false}
        onBack={pop}
        onNewInvoice={() => push('createInvoice')}
        onInvoicePress={(invoice) => console.log('Invoice tapped', invoice)}
      />
    );
  }

  if (stackScreen === 'viewReturns') {
    return (
      <ViewReturnsScreen
        onBack={pop}
        onReturnPress={(ret) => console.log('Return tapped', ret)}
      />
    );
  }

  if (stackScreen === 'reports') {
    return <ReportsScreen onBack={pop} />;
  }

  if (stackScreen === 'recordExpense') {
    return (
      <RecordExpenseScreen
        onBack={pop}
        onSave={async (expense) => {
          // Reference number (EXP-…) so a journal entry can point to this expense
          const existing = await dataStore.expenses.getAll();
          await dataStore.expenses.add({ ...expense, id: nextDocNumber(existing, 'EXP', 1001) });
          pop();
        }}
      />
    );
  }

  if (stackScreen === 'addBuyer') {
    return (
      <AddBuyerScreen
        onBack={pop}
        onSave={async (buyer) => { await dataStore.buyers.add(buyer); pop(); }}
      />
    );
  }

  if (stackScreen === 'addSeller') {
    return (
      <AddSellerScreen
        onBack={pop}
        onSave={async (seller) => { await dataStore.sellers.add(seller); pop(); }}
      />
    );
  }

  if (stackScreen === 'addTransporter') {
    return (
      <AddTransporterScreen
        onBack={pop}
        onSave={async (transporter) => { await dataStore.transporters.add(transporter); pop(); }}
      />
    );
  }

  if (stackScreen === 'viewLRs') {
    return (
      <ViewLRsScreen
        onBack={pop}
        onLRPress={(lr) => console.log('LR tapped', lr)}
        onAddLR={() => console.log('Add LR tapped')}
      />
    );
  }

  if (stackScreen === 'createOrder') {
    return (
      <CreateOrderScreen
        onBack={pop}
        onSave={async (order) => {
          const existing = await dataStore.orders.getAll();
          await dataStore.orders.add({ ...order, id: nextDocNumber(existing, 'ORD', 5001) });
          pop();
        }}
      />
    );
  }

  if (stackScreen === 'viewOrders') {
    return (
      <ViewOrdersScreen
        onBack={pop}
        onAddOrder={() => push('createOrder')}
        onOrderPress={(order) => console.log('Order tapped', order)}
      />
    );
  }

  // --- Bottom tabs ---
  return (
    <>
      {activeTab === 'home' && (
        <DashboardScreen
          userName={userName || 'there'}
          onMenuPress={() => setMenuVisible(true)}
          onNotificationPress={() => console.log('Notifications tapped')}
          onQuickAction={handleQuickAction}
          onViewAllInvoices={() => push('viewInvoices')}
          onInvoicePress={(invoice) => console.log('Invoice tapped', invoice)}
          onTabPress={goToTab}
        />
      )}

      {activeTab === 'invoices' && (
        <InvoicesScreen
          onNewInvoice={() => push('createInvoice')}
          onInvoicePress={(invoice) => console.log('Invoice tapped', invoice)}
          onTabPress={goToTab}
        />
      )}

      {activeTab === 'parties' && (
        <PartiesScreen
          onPartyPress={(party) => console.log('Party tapped', party)}
          onAddBuyer={() => push('addBuyer')}
          onAddSeller={() => push('addSeller')}
          onTabPress={goToTab}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentsScreen
          onPaymentPress={(payment) => console.log('Payment tapped', payment)}
          onRecordPayment={() => push('createPayment')}
          onTabPress={goToTab}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileScreen
          profile={profile}
          mobile={mobile}
          onLogout={handleLogout}
          onTabPress={goToTab}
        />
      )}

      <MenuDrawer
        visible={menuVisible}
        name={(profile && profile.name) || userName}
        subtitle={(profile && profile.businessName) || (mobile ? `+91 ${mobile}` : '')}
        onClose={() => setMenuVisible(false)}
        onSelect={(key) => {
          setMenuVisible(false);
          push(key); // 'createOrder' | 'viewOrders' | 'recordExpense' | 'reports' | 'addTransporter' | 'viewLRs'
        }}
      />
    </>
  );
}