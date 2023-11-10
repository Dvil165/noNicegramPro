import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb'
// Phai co 2 thang nay thi moi dung dc bien trong file .env
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { Follower } from '~/models/schemas/Followers.schema'
config()

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@nonicegramproject.syah5fn.mongodb.net/?retryWrites=true&w=majority`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      // Neu bi loi thi xem, sau do nem ra ngoai
      console.log(error)
      throw error
    } // Khong can finally, vi no se close connet
  }

  get users(): Collection<User> {
    //                                   neu ko co as string thi no se bao unf,
    // ma minh biet chac no la string, nen la as string
    return this.db.collection(process.env.DB_USERS_COLLECTIONS as string)
  }

  get refreshTokens(): Collection<RefreshToken> {
    //                                   neu ko co as string thi no se bao unf,
    // ma minh biet chac no la string, nen la as string
    return this.db.collection(process.env.DB_REFRESHTOKENS_COLLECTIONS as string)
  }

  get followers(): Collection<Follower> {
    //                                   neu ko co as string thi no se bao undefined,
    // ma minh biet chac no la string, nen la as string
    return this.db.collection(process.env.DB_FOLLOWERS_COLLECTIONS as string)
  }
}

const databaseService = new DatabaseService()
export default databaseService
