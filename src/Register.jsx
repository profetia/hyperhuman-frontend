import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { send_email_verification_code, register } from './net'

export default function Register() {

    const navigate = useNavigate()
    const [registerStage, setRegisterStage] = useState('submit')

    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [invitationCode, setInvitationCode] = useState('')
    const [password, setPassword] = useState('')
    const [submitionError, setSubmitionError] = useState('')

    const [emailVerificationCode, setEmailVerificationCode] = useState('')
    const [registerError, setRegisterError] = useState('')

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!username) {
            setSubmitionError('Username is required')
            return
        }
        if (!email) {
            setSubmitionError('Email is required')
            return
        }
        if (!/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email)) {
            setSubmitionError('Email is not valid')
            return
        }
        if (!invitationCode) {
            setSubmitionError('Invitation code is required')
            return
        }
        if (!password) {
            setSubmitionError('Password is required')
            return
        }        
        const response = await send_email_verification_code({
            email,
            type: 'Register'
        })
        setSubmitionError('')
        setRegisterStage('register')
    }

    const onRegister = async (e) => {
        e.preventDefault()
        if (!emailVerificationCode) {
            setRegisterError('Verification code is required')
            return
        }
        const response = await register({
            username,
            email,
            invitationCode,
            password,
            emailVerificationCode
        })
        setRegisterError('')
        navigate('/')
    }

    return (
        <>
            <h1>Register</h1>
            {
                registerStage === 'submit' && (
                    <form style={{display: 'flex', flexDirection: 'column'}}
                        onSubmit={onSubmit}
                    >
                        <label htmlFor="username">Username</label>
                        <input type="text" id="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <label type="invitation_code">Invitation Code</label>
                        <input type="text" id="invitation_code" 
                            value={invitationCode}
                            onChange={e => setInvitationCode(e.target.value)}
                        />
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button type="submit">Submit</button>
                        {
                            submitionError && <p style={{color: 'red'}}>{submitionError}</p>
                        }
                    </form>
                )
            }
            {
                registerStage === 'register' && (
                    <form style={{display: 'flex', flexDirection: 'column'}}
                        onSubmit={onRegister}
                    >
                        <label htmlFor="email_verification_code">Verification Code</label>
                        <input type="text" id="email_verification_code"
                            value={emailVerificationCode}
                            onChange={e => setEmailVerificationCode(e.target.value)}
                        />
                        <button type="submit">Register</button>
                        {
                            registerError && <p style={{color: 'red'}}>{registerError}</p>
                        }
                    </form>                    
                )
            }
        </>
    )
}