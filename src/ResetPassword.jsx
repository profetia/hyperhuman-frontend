import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { send_email_verification_code, reset_password } from './net'

export default function ResetPassword() {
    const navigate = useNavigate()
    const [resetStage, setResetStageStage] = useState('submit')

    const [email, setEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [submitionError, setSubmitionError] = useState('')

    const [emailVerificationCode, setEmailVerificationCode] = useState('')
    const [resetPasswordError, setResetPasswordError] = useState('')

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!email) {
            setSubmitionError('Email is required')
            return
        }
        if (!/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email)) {
            setSubmitionError('Email is not valid')
            return
        }
        if (!newPassword) {
            setSubmitionError('Password is required')
            return
        }        
        const response = await send_email_verification_code({
            email,
            type: 'ResetPassword'
        })
        setSubmitionError('')
        setResetStageStage('resetPassword')
    }

    const onResetPassword = async (e) => {
        e.preventDefault()
        if (!emailVerificationCode) {
            setResetPasswordError('Verification code is required')
            return
        }
        const response = await reset_password({
            email,
            newPassword,
            emailVerificationCode
        })
        setResetPasswordError('')
        navigate('/')
    }

    return (
        <>
            <h1>Reset Password</h1>
            {
                resetStage === 'submit' && (
                    <form style={{display: 'flex', flexDirection: 'column'}}
                        onSubmit={onSubmit}
                    >
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <label htmlFor="newPassword">New Password</label>
                        <input type="password" id="newPassword" 
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                        <button type="submit">Submit</button>
                        {
                            submitionError && <p style={{color: 'red'}}>{submitionError}</p>
                        }
                    </form>
                )
            }
            {
                resetStage === 'resetPassword' && (
                    <form style={{display: 'flex', flexDirection: 'column'}}
                        onSubmit={onResetPassword}
                    >
                        <label htmlFor="email_verification_code">Verification Code</label>
                        <input type="text" id="email_verification_code"
                            value={emailVerificationCode}
                            onChange={e => setEmailVerificationCode(e.target.value)}
                        />
                        <button type="submit">Reset Password</button>
                        {
                            resetPasswordError && <p style={{color: 'red'}}>{resetPasswordError}</p>
                        }
                    </form>                    
                )
            }
        </>
    )
}