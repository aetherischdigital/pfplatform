import Container from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'

export default function NotFound() {
  return (
    <Container className="py-32 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-accent-600">404</p>
      <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight text-surface-900">
        Page not found.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-surface-500">
        The page you're looking for doesn't exist or has moved.
      </p>
      <div className="mt-8 flex justify-center">
        <ButtonLink to="/" variant="primary" size="lg">
          Back to home
        </ButtonLink>
      </div>
    </Container>
  )
}
