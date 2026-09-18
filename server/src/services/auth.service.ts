import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, type UserDocument } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { activityService } from './activity.service.js';

interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

interface LoginInput {
    email: string;
    password: string;
}

const signToken = (id: string): string =>
    jwt.sign({ id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);

export const authService = {
    async register(input: RegisterInput) {
        const exists = await User.findOne({ email: input.email });
        if (exists) throw new ApiError(409, 'Email already registered');

        const hashed = await bcrypt.hash(input.password, 12);
        const user = await User.create({ ...input, password: hashed });

        return { user: sanitize(user), accessToken: signToken(user._id.toString()) };
    },

    async login(input: LoginInput) {
        const user = await User.findOne({ email: input.email }).select('+password');
        if (!user) throw new ApiError(401, 'Invalid credentials');

        const ok = await bcrypt.compare(input.password, user.password!);
        if (!ok) throw new ApiError(401, 'Invalid credentials');

        user.lastActiveAt = new Date();
        await user.save();

        // Log login activity (0 XP, but counts for streak + heatmap)
        await activityService.record({
            userId: user._id.toString(),
            type: 'login',
            xp: 0,
        });

        return { user: sanitize(user), accessToken: signToken(user._id.toString()) };
    },

    async me(userId: string) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, 'User not found');
        return sanitize(user);
    },
};

function sanitize(user: UserDocument) {
    const obj = user.toObject();
    delete obj.password;
    return obj;
}