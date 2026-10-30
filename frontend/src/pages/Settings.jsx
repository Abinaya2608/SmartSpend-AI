
import { useEffect, useState } from 'react';
import {
  UserRound,
  ShieldCheck,
  Bell,
  LogOut,
  Save,
  LockKeyhole,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  CheckCircle2
} from 'lucide-react';

import API from '../services/api';
import './Settings.css';

function Settings({ user, onProfileUpdated, onLogout }) {
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const [password, setPassword] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPasswords, setShowPasswords] = useState(false);

  const [preferences, setPreferences] = useState(() => {
    try {
      return {
        currency: localStorage.getItem('preferred_currency') || 'INR',
        notifications:
          localStorage.getItem('notifications_enabled') !== 'false'
      };
    } catch {
      return { currency: 'INR', notifications: true };
    }
  });

  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setProfile({
      name: user?.name || '',
      email: user?.email || ''
    });
  }, [user]);

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    setProfileMessage('');
    setProfileError('');

    try {
      setSavingProfile(true);

      const response = await API.put('/auth/profile', {
        name: profile.name.trim(),
        email: profile.email.trim()
      });

      const updatedUser = response.data.user;

      localStorage.setItem('user', JSON.stringify(updatedUser));

      onProfileUpdated?.(updatedUser);

      setProfileMessage('Profile updated successfully.');
    } catch (err) {
      setProfileError(
        err.response?.data?.message || 'Unable to update profile.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword({
      ...password,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    setPasswordMessage('');
    setPasswordError('');

    if (password.new_password !== password.confirm_password) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);

      const response = await API.post('/auth/change-password', password);

      setPassword({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      setPasswordMessage(
        response.data.message || 'Password changed successfully.'
      );
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || 'Unable to change password.'
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    const updated = {
      ...preferences,
      [key]: value
    };

    setPreferences(updated);

    if (key === 'currency') {
      localStorage.setItem('preferred_currency', value);
    }

    if (key === 'notifications') {
      localStorage.setItem('notifications_enabled', String(value));
    }
  };

  return (
    <div className="settings-page">

      <div className="settings-header">
        <div>
          <p className="settings-eyebrow">ACCOUNT MANAGEMENT</p>
          <h1>Settings</h1>
          <p>Manage your profile, security and preferences.</p>
        </div>
        <SettingsIcon size={27} />
      </div>

      {/* Profile settings */}
      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-heading-icon profile-setting-icon">
            <UserRound size={21} />
          </div>
          <div>
            <h2>Profile Information</h2>
            <p>Update your personal account details.</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit}>
          <div className="settings-form-grid">
            <div className="settings-field">
              <label htmlFor="settings-name">Full Name</label>
              <input
                id="settings-name"
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                placeholder="Enter your name"
                maxLength={100}
                required
              />
            </div>

            <div className="settings-field">
              <label htmlFor="settings-email">Email Address</label>
              <input
                id="settings-email"
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                placeholder="Enter your email"
                maxLength={150}
                required
              />
            </div>
          </div>

          {profileMessage && (
            <div className="settings-success">
              <CheckCircle2 size={17} />
              {profileMessage}
            </div>
          )}

          {profileError && (
            <div className="settings-error">{profileError}</div>
          )}

          <button
            className="settings-primary-btn"
            type="submit"
            disabled={savingProfile}
          >
            <Save size={16} />
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>

      {/* Security settings */}
      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-heading-icon security-setting-icon">
            <ShieldCheck size={21} />
          </div>
          <div>
            <h2>Security</h2>
            <p>Change your account password.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit}>
          <div className="settings-password-grid">
            <div className="settings-field">
              <label htmlFor="current-password">Current Password</label>
              <input
                id="current-password"
                type={showPasswords ? 'text' : 'password'}
                name="current_password"
                value={password.current_password}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="settings-field">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type={showPasswords ? 'text' : 'password'}
                name="new_password"
                value={password.new_password}
                onChange={handlePasswordChange}
                placeholder="Minimum 8 characters"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="settings-field">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                type={showPasswords ? 'text' : 'password'}
                name="confirm_password"
                value={password.confirm_password}
                onChange={handlePasswordChange}
                placeholder="Re-enter new password"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button
            type="button"
            className="settings-show-password"
            onClick={() => setShowPasswords(!showPasswords)}
          >
            {showPasswords ? <EyeOff size={15} /> : <Eye size={15} />}
            {showPasswords ? 'Hide passwords' : 'Show passwords'}
          </button>

          {passwordMessage && (
            <div className="settings-success">
              <CheckCircle2 size={17} />
              {passwordMessage}
            </div>
          )}

          {passwordError && (
            <div className="settings-error">{passwordError}</div>
          )}

          <button
            className="settings-primary-btn"
            type="submit"
            disabled={savingPassword}
          >
            <LockKeyhole size={16} />
            {savingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </section>

      {/* Preferences */}
      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-heading-icon preference-setting-icon">
            <Bell size={21} />
          </div>
          <div>
            <h2>Preferences</h2>
            <p>Customize your SmartSpend experience.</p>
          </div>
        </div>

        <div className="settings-preference-row">
          <div>
            <strong>Display Currency</strong>
            <p>Choose your preferred currency.</p>
          </div>

          <select
            value={preferences.currency}
            onChange={(e) =>
              handlePreferenceChange('currency', e.target.value)
            }
          >
            <option value="INR">INR - Indian Rupee (₹)</option>
            <option value="USD">USD - US Dollar ($)</option>
            <option value="EUR">EUR - Euro (€)</option>
            <option value="GBP">GBP - British Pound (£)</option>
          </select>
        </div>

        <div className="settings-preference-row">
          <div>
            <strong>Notifications</strong>
            <p>Enable or disable notification preferences.</p>
          </div>

          <label className="settings-switch">
            <input
              type="checkbox"
              checked={preferences.notifications}
              onChange={(e) =>
                handlePreferenceChange('notifications', e.target.checked)
              }
            />
            <span className="settings-switch-slider" />
          </label>
        </div>

        <p className="settings-local-note">
          Preferences are currently saved in this browser.
        </p>
      </section>

      {/* Account */}
      <section className="settings-card settings-account-card">
        <div className="settings-card-heading">
          <div className="settings-heading-icon account-setting-icon">
            <LogOut size={21} />
          </div>
          <div>
            <h2>Account</h2>
            <p>Sign out of your SmartSpend account.</p>
          </div>
        </div>

        <button
          className="settings-logout-btn"
          onClick={onLogout}
          type="button"
        >
          <LogOut size={17} />
          Log Out
        </button>
      </section>

    </div>
  );
}

export default Settings;
