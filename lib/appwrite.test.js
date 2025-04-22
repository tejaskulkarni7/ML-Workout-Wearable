import {
    account,
    databases,
    functions,
    newGoalFunction,
    deleteGoal,
    uploadRecording,
    createUser,
    signIn,
    logout,
    deleteAccount,
  } from './appwrite.js';
  
  import * as SecureStore from 'expo-secure-store';
  
  jest.mock('expo-secure-store', () => ({
    deleteItemAsync: jest.fn(),
  }));
  
  jest.mock('./appwrite.js', () => {
    const mockAccount = {
      create: jest.fn(),
      get: jest.fn(),
      getSession: jest.fn(),
      createEmailPasswordSession: jest.fn(),
      deleteSession: jest.fn(),
    };
  
    const mockDatabases = {
      createDocument: jest.fn(),
      listDocuments: jest.fn(),
      deleteDocument: jest.fn(),
      updateDocument: jest.fn(),
    };
  
    const mockFunctions = {
      createExecution: jest.fn(),
    };
  
    return {
      account: mockAccount,
      databases: mockDatabases,
      functions: mockFunctions,
      createUser: jest.fn(),
      signIn: jest.fn(),
      logout: jest.fn(),
      deleteAccount: jest.fn(),
      newGoalFunction: jest.fn(),
      deleteGoal: jest.fn(),
      uploadRecording: jest.fn(),
    };
  });
  
  describe('Appwrite Functions', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe('createUser', () => {
      it('creates a user and user document', async () => {
        account.create.mockResolvedValue({ $id: 'user123' });
        databases.createDocument.mockResolvedValue({ $id: 'doc123' });
  
        const user = await createUser('email@test.com', 'pass', 'testuser');
  
        expect(account.create).toHaveBeenCalled();
        expect(databases.createDocument).toHaveBeenCalled();
        expect(user).toEqual({ $id: 'doc123' });
      });
  
      it('throws error if account creation fails', async () => {
        account.create.mockRejectedValue(new Error('fail'));
  
        await expect(
          createUser('email@test.com', 'pass', 'testuser')
        ).rejects.toThrow('fail');
      });
    });
  
    describe('signIn', () => {
      it('returns existing session', async () => {
        account.getSession.mockResolvedValue({ $id: 'session123' });
  
        const session = await signIn('email@test.com', 'pass');
  
        expect(session).toEqual({ $id: 'session123' });
      });
  
      it('creates session if none exists', async () => {
        account.getSession.mockRejectedValue(new Error('No session'));
        account.createEmailPasswordSession.mockResolvedValue({ $id: 'newsess' });
  
        const session = await signIn('email@test.com', 'pass');
  
        expect(session).toEqual({ $id: 'newsess' });
      });
  
      it('throws for 401', async () => {
        account.getSession.mockRejectedValue(new Error('No session'));
        account.createEmailPasswordSession.mockRejectedValue({ code: 401 });
  
        await expect(signIn('email@test.com', 'wrong')).rejects.toThrow(
          'Invalid email or password. Please try again.'
        );
      });
    });
  
    describe('logout', () => {
      it('deletes session and clears storage', async () => {
        account.deleteSession.mockResolvedValue();
  
        const result = await logout();
  
        expect(account.deleteSession).toHaveBeenCalledWith('current');
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
        expect(result).toBe(true);
      });
  
      it('throws if logout fails', async () => {
        account.deleteSession.mockRejectedValue(new Error('fail'));
  
        await expect(logout()).rejects.toThrow(
          'Failed to log out. Please try again.'
        );
      });
    });
  
    describe('newGoalFunction', () => {
      it('creates a goal', async () => {
        account.get.mockResolvedValue({ $id: 'user123' });
        databases.createDocument.mockResolvedValue({ $id: 'goal123' });
  
        const result = await newGoalFunction('Push-ups', '10');
  
        expect(databases.createDocument).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.any(String),
          expect.objectContaining({
            exercise: 'Push-ups',
            reps_goal: 10,
            current_rep: 0,
            user_id: 'user123',
            createdAt: expect.any(String),
          })
        );
        expect(result).toEqual({ $id: 'goal123' });
      });
    });
  
    describe('deleteGoal', () => {
      it('deletes a goal', async () => {
        databases.deleteDocument.mockResolvedValue();
  
        await deleteGoal('goal123');
  
        expect(databases.deleteDocument).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          'goal123'
        );
      });
  
      it('throws if delete fails', async () => {
        databases.deleteDocument.mockRejectedValue(new Error('fail'));
  
        await expect(deleteGoal('goal123')).rejects.toThrow(
          'Failed to delete goal. Please try again.'
        );
      });
    });
  
    describe('uploadRecording', () => {
      it('creates set and updates goal if recent', async () => {
        account.get.mockResolvedValue({ $id: 'user123' });
        databases.listDocuments
          .mockResolvedValueOnce({
            documents: [{ $id: 'workout123', date: new Date().toISOString() }],
          })
          .mockResolvedValueOnce({
            documents: [
              { $id: 'goal123', exercise: 'Push-ups', current_rep: 10 },
            ],
          });
        databases.createDocument.mockResolvedValue({ $id: 'set123' });
        databases.updateDocument.mockResolvedValue();
  
        const result = await uploadRecording(100, 'Push-ups', 10);
  
        expect(result).toEqual({ $id: 'set123' });
        expect(databases.updateDocument).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          'goal123',
          { current_rep: 20 }
        );
      });
  
      it('creates new workout if none recent', async () => {
        const oldDate = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3 hours ago
        account.get.mockResolvedValue({ $id: 'user123' });
        databases.listDocuments.mockResolvedValueOnce({
          documents: [{ $id: 'oldWorkout', date: oldDate }],
        });
        databases.createDocument
          .mockResolvedValueOnce({ $id: 'newWorkout' }) // create new workout
          .mockResolvedValueOnce({ $id: 'set456' }); // create set
        databases.listDocuments.mockResolvedValueOnce({
          documents: [],
        });
  
        const result = await uploadRecording(90, 'Squats', 15);
  
        expect(result).toEqual({ $id: 'set456' });
      });
  
      it('throws if set creation fails', async () => {
        account.get.mockResolvedValue({ $id: 'user123' });
        databases.createDocument.mockRejectedValue(new Error('fail'));
  
        await expect(uploadRecording(90, 'Squats', 15)).rejects.toThrow(
          'Failed to create recording. Please try again.'
        );
      });
    });
  
    describe('deleteAccount', () => {
      it('calls cloud function and handles success', async () => {
        account.get.mockResolvedValue({ $id: 'user123' });
        functions.createExecution.mockResolvedValue({
          response: JSON.stringify({ success: true }),
        });
  
        const result = await deleteAccount();
  
        expect(result).toBe(true);
      });
  
      it('handles failure response from cloud', async () => {
        account.get.mockResolvedValue({ $id: 'user123' });
        functions.createExecution.mockResolvedValue({
          response: JSON.stringify({ success: false, message: 'Failure' }),
        });
  
        const result = await deleteAccount();
  
        expect(result).toBe(true); // Still true, error is logged, not thrown
      });
  
      it('throws if cloud fails hard', async () => {
        account.get.mockResolvedValue({ $id: 'user123' });
        functions.createExecution.mockRejectedValue(new Error('fail'));
  
        await expect(deleteAccount()).rejects.toThrow(
          'Failed to delete account. Please try again.'
        );
      });
    });
  });
  