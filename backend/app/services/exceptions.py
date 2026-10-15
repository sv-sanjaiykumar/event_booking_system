class EventNotFoundError(Exception):
    pass


class EventSoldOutError(Exception):
    pass


class AlreadyBookedAsSelfError(Exception):
    pass


class InsufficientSeatsError(Exception):
    pass


class BookingNotFoundError(Exception):
    pass


class InvalidCancellationQuantityError(Exception):
    pass


class DuplicateEmailError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class InvalidSessionError(Exception):
    pass


class PermissionDeniedError(Exception):
    pass


class EventNotEditableError(Exception):
    pass


class EventCancelledError(Exception):
    pass


class EventAlreadyStartedError(Exception):
    pass


class DuplicateEventError(Exception):
    pass


class CapacityBelowBookingsError(Exception):
    pass
