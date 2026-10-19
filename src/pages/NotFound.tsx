import { Link } from 'react-router-dom'
import { PageHead } from '../components/chrome'

export default function NotFound() {
  return (
    <PageHead title="404" lede="That page isn't in the Hub.">
      <p style={{ marginTop: 18 }}><Link className="btn btn--green" to="/">Back to the Biohacking Hub</Link></p>
    </PageHead>
  )
}
