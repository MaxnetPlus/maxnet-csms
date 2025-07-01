<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to Join Our System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }

        .content {
            background-color: #fff;
            padding: 30px;
            border: 1px solid #e9ecef;
        }

        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #6c757d;
            border-radius: 0 0 8px 8px;
        }

        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }

        .btn:hover {
            background-color: #0056b3;
        }

        .info-box {
            background-color: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #007bff;
            margin: 20px 0;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>You're Invited!</h1>
    </div>

    <div class="content">
        <p>Hello,</p>

        <p>You have been invited to join our Customer Service Management System (CSMS) by
            <strong>{{ $invitation->inviter->name }}</strong>.</p>

        <div class="info-box">
            <p><strong>Invitation Details:</strong></p>
            <ul>
                <li><strong>Email:</strong> {{ $invitation->email }}</li>
                <li><strong>Role:</strong> {{ ucfirst($invitation->role) }}</li>
                <li><strong>Invited by:</strong> {{ $invitation->inviter->name }}</li>
                <li><strong>Expires on:</strong> {{ $invitation->expires_at->format('F j, Y g:i A') }}</li>
            </ul>
        </div>

        <p>To accept this invitation and create your account, please click the button below:</p>

        <div style="text-align: center;">
            <a href="{{ $acceptUrl }}" class="btn">Accept Invitation & Create Account</a>
        </div>

        <p>If you're unable to click the button above, you can also copy and paste the following link into your browser:
        </p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
            {{ $acceptUrl }}</p>

        <p><strong>Important:</strong> This invitation will expire on
            {{ $invitation->expires_at->format('F j, Y g:i A') }}. Please accept it before then.</p>

        <p>If you have any questions or need assistance, please contact our support team.</p>

        <p>Best regards,<br>
            The CSMS Team</p>
    </div>

    <div class="footer">
        <p>This email was sent because you were invited to join our system. If you believe this is a mistake, please
            ignore this email.</p>
        <p>&copy; {{ date('Y') }} CSMS. All rights reserved.</p>
    </div>
</body>

</html>
