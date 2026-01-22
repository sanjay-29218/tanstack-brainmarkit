import { httpRouter } from 'convex/server'
import { authComponent, createAuth } from './auth'
import { stream } from './stream'

const http = httpRouter()

authComponent.registerRoutes(http, createAuth)

export default http
