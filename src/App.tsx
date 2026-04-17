import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, collection } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, CalorieEntry, OperationType } from './types';
import { handleFirestoreError } from './lib/utils';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import Reports from './components/Reports';
import ProfileSettings from './components/ProfileSettings';
import NutritionAnalysis from './components/NutritionAnalysis';
import AuthScreen from './components/AuthScreen';
import { Layout } from './components/Layout';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<CalorieEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entries' | 'reports' | 'profile' | 'analysis'>('dashboard');
  const [editingEntry, setEditingEntry] = useState<CalorieEntry | null>(null);

  const handleEdit = (entry: CalorieEntry) => {
    setEditingEntry(entry);
    setActiveTab('entries');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setEntries([]);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      
      // Ensure profile exists
      const profileRef = doc(db, 'users', currentUser.uid);
      try {
        const profileSnap = await getDoc(profileRef);
        if (!profileSnap.exists()) {
          const newProfile: UserProfile = {
            userId: currentUser.uid,
            email: currentUser.email || `user_${currentUser.uid.slice(0, 5)}@calotrack.local`,
            targetCalories: 2000,
            defaultDailyBurn: 1500,
          };
          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
        } else {
          setProfile(profileSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const entriesPath = `users/${user.uid}/entries`;
    const unsubscribe = onSnapshot(
      collection(db, entriesPath), 
      (snapshot) => {
        const entriesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as CalorieEntry[];
        setEntries(entriesData.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, entriesPath);
      }
    );

    // Also listen to profile changes
    const profileUnsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          setProfile(doc.data() as UserProfile);
        }
      }
    );

    return () => {
      unsubscribe();
      profileUnsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-accent-net" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={() => setLoading(true)} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user}>
      {activeTab === 'dashboard' && (
        <Dashboard 
          profile={profile} 
          entries={entries} 
          user={user} 
          onEdit={handleEdit} 
        />
      )}
      {activeTab === 'entries' && (
        <EntryForm 
          user={user} 
          entries={entries} 
          editingEntry={editingEntry} 
          onCancelEdit={() => setEditingEntry(null)} 
        />
      )}
      {activeTab === 'reports' && <Reports entries={entries} profile={profile} />}
      {activeTab === 'analysis' && <NutritionAnalysis entries={entries} />}
      {activeTab === 'profile' && <ProfileSettings profile={profile} user={user} />}
    </Layout>
  );
}
