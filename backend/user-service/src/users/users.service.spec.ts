import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let repository: any;

  beforeEach(() => {
    repository = {
      findOne: vi.fn(),
      create: vi.fn((data) => data),
      save: vi.fn(async (data) => data),
      update: vi.fn(),
    };

    service = new UsersService(repository);
  });

  it('finds a user by email', async () => {
    repository.findOne.mockResolvedValue({ id: 'user-1' });

    await expect(service.findByEmail('test@example.com')).resolves.toEqual({
      id: 'user-1',
    });

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
  });

  it('returns null when the email is not found', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findByEmail('missing@example.com')).resolves.toBeNull();
  });

  it('creates and saves a user', async () => {
    const data = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    await expect(service.createUser(data)).resolves.toEqual(data);
    expect(repository.create).toHaveBeenCalledWith(data);
    expect(repository.save).toHaveBeenCalledWith(data);
  });

  it('finds a user by ID', async () => {
    repository.findOne.mockResolvedValue({ id: 'user-1' });

    await expect(service.findById('user-1')).resolves.toEqual({
      id: 'user-1',
    });

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });

  it('marks a user email as verified', async () => {
    await service.verifyEmail('user-1');

    expect(repository.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      { emailVerified: true },
    );
  });

  it('updates a user password hash', async () => {
    await service.updatePassword('user-1', 'new-hash');

    expect(repository.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      { passwordHash: 'new-hash' },
    );
  });
});
