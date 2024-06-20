import express, { Request, Response } from 'express';
import { sendMail } from '../mailer';

const router = express.Router();

router.post('/send-email', async (req: Request, res: Response) => {
    const { to, subject, text, html } = req.body;

    if (!to || !subject || !text) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        await sendMail(to, subject, text, html);
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending email', error });
    }
});

export default router;